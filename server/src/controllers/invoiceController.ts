// =============================================================================
// Invoice Controller — CRUD with multi-tenant isolation
// =============================================================================

import { Response, NextFunction } from 'express';
import { query, transaction } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  PaginatedResponse,
  Invoice,
  InvoiceItem,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateInvoiceNumber(tenantId: string): string {
  const prefix = tenantId.substring(0, 4).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${prefix}-${timestamp}${random}`;
}

// ---------------------------------------------------------------------------
// GET /api/invoices
// Lists invoices for the authenticated user's tenant, with optional filters.
// ---------------------------------------------------------------------------

export async function getInvoices(
  req: AuthenticatedRequest,
  res: Response<ApiResponse | PaginatedResponse<Invoice>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { status, currency, page, limit } = req.query as unknown as { status?: string; currency?: string; page: number; limit: number };

    const pageNum = page;
    const limitNum = limit;
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant isolation — always first param
    conditions.push(`i.tenant_id = $1 AND i.deleted_at IS NULL`);
    params.push(tenantId);

    let paramIndex = 2;

    if (status) {
      conditions.push(`i.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (currency) {
      conditions.push(`i.currency = $${paramIndex}`);
      params.push(currency);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM invoices i WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    // Fetch rows with client name
    const dataRes = await query<Invoice & { client_name: string }>(
      `SELECT i.*, c.name as client_name
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/invoices/:id
// Returns a single invoice with its line items.
// ---------------------------------------------------------------------------

export async function getInvoice(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenant_id;

    const invoiceRes = await query<Invoice & { client_name: string; client_email: string }>(
      `SELECT i.*, c.name as client_name, c.email as client_email
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.id = $1 AND i.tenant_id = $2 AND i.deleted_at IS NULL`,
      [id, tenantId]
    );

    if (invoiceRes.rows.length === 0) {
      throw new AppError('Invoice not found.', 404);
    }

    const invoice = invoiceRes.rows[0];

    // Fetch line items
    const itemsRes = await query<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    );

    res.json({
      success: true,
      data: { ...invoice, items: itemsRes.rows },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/invoices
// Creates a new invoice with line items for the authenticated user's tenant.
// ---------------------------------------------------------------------------

export async function createInvoice(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const body = req.body as { client_id: string; invoice_number?: string; currency: string; status: string; due_date: string; items: { description: string; quantity: number; unit_price: number }[] };

    // Verify client belongs to this tenant
    const clientCheck = await query(
      'SELECT id FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [body.client_id, tenantId]
    );
    if (clientCheck.rows.length === 0) {
      throw new AppError('Client not found.', 404);
    }

    const invoiceNumber = body.invoice_number || generateInvoiceNumber(tenantId);

    // --- Create invoice + items in a transaction ---
    const result = await transaction(async (tx) => {
      // Create invoice
      const invoiceRes = await tx<Invoice>(
        `INSERT INTO invoices (tenant_id, client_id, invoice_number, amount, currency, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          tenantId,
          body.client_id,
          invoiceNumber,
          0, // amount will be recalculated by trigger
          body.currency || 'USD',
          body.status,
          body.due_date,
        ]
      );
      const invoice = invoiceRes.rows[0];

      // Create items
      for (const item of body.items) {
        const total = Math.round(item.quantity * item.unit_price * 100) / 100;
        await tx<InvoiceItem>(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoice.id, item.description, item.quantity, item.unit_price, total]
        );
      }

      // Fetch updated invoice (amount recalculated by trigger)
      const updatedRes = await tx<Invoice>('SELECT * FROM invoices WHERE id = $1', [invoice.id]);
      return updatedRes.rows[0];
    });

    // Fetch items to return
    const itemsRes = await query<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [result.id]
    );

    res.status(201).json({
      success: true,
      data: { ...result, items: itemsRes.rows },
      message: 'Invoice created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/invoices/:id
// Updates an invoice and optionally replaces its line items.
// ---------------------------------------------------------------------------

export async function updateInvoice(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenant_id;
    const body = req.body as { client_id?: string; invoice_number?: string; currency?: string; status?: string; due_date?: string; items?: { description: string; quantity: number; unit_price: number }[] };

    // Verify invoice exists and belongs to tenant
    const existing = await query<Invoice>(
      'SELECT id FROM invoices WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    if (existing.rows.length === 0) {
      throw new AppError('Invoice not found.', 404);
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (body.client_id !== undefined) {
      // Verify client belongs to tenant
      const clientCheck = await query(
        'SELECT id FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
        [body.client_id, tenantId]
      );
      if (clientCheck.rows.length === 0) {
        throw new AppError('Client not found.', 404);
      }
      updates.push(`client_id = $${paramIndex}`);
      params.push(body.client_id);
      paramIndex++;
    }

    if (body.invoice_number !== undefined) {
      updates.push(`invoice_number = $${paramIndex}`);
      params.push(body.invoice_number);
      paramIndex++;
    }

    if (body.currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      params.push(body.currency);
      paramIndex++;
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(body.status);
      paramIndex++;
    }

    if (body.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(body.due_date);
      paramIndex++;
    }

    const result = await transaction(async (tx) => {
      // Update invoice fields if any
      if (updates.length > 0) {
        params.push(id); // for WHERE id = $paramIndex
        await tx(
          `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          params
        );
      }

      // Replace items if provided
      if (body.items !== undefined && body.items.length > 0) {
        // Delete existing items
        await tx('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

        // Insert new items
        for (const item of body.items) {
          const total = Math.round(item.quantity * item.unit_price * 100) / 100;
          await tx<InvoiceItem>(
            `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, item.description, item.quantity, item.unit_price, total]
          );
        }
      }

      // Return updated invoice
      const updated = await tx<Invoice>('SELECT * FROM invoices WHERE id = $1', [id]);
      return updated.rows[0];
    });

    // Fetch items
    const itemsRes = await query<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: { ...result, items: itemsRes.rows },
      message: 'Invoice updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/invoices/:id
// Soft-deletes an invoice (sets deleted_at).
// ---------------------------------------------------------------------------

export async function deleteInvoice(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenant_id;

    const result = await query(
      `UPDATE invoices
       SET deleted_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invoice not found.', 404);
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
