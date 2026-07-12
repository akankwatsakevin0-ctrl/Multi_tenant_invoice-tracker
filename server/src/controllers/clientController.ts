// =============================================================================
// Client Controller — CRUD with multi-tenant isolation
// =============================================================================

import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  Client,
} from '../types';

// ---------------------------------------------------------------------------
// GET /api/clients
// Lists all clients for the authenticated user's tenant.
// ---------------------------------------------------------------------------

export async function getClients(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Client[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;

    const result = await query<Client>(
      `SELECT id, tenant_id, name, email, address, created_at
       FROM clients
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY name ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/clients
// Creates a new client for the authenticated user's tenant.
// ---------------------------------------------------------------------------

export async function createClient(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Client>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { name, email, address } = req.body as { name: string; email?: string | null; address?: string | null };

    const result = await query<Client>(
      `INSERT INTO clients (tenant_id, name, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, name, email, address, created_at`,
      [tenantId, name, email || null, address || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Client created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/clients/:id
// Updates a client for the authenticated user's tenant.
// ---------------------------------------------------------------------------

export async function updateClient(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Client>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;
    const { name, email, address } = req.body as { name?: string; email?: string | null; address?: string | null };

    const existing = await query<Client>(
      'SELECT id FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    if (existing.rows.length === 0) {
      throw new AppError('Client not found.', 404);
    }

    const result = await query<Client>(
      `UPDATE clients
       SET name = COALESCE($1, name), email = COALESCE($2, email), address = COALESCE($3, address)
       WHERE id = $4 AND tenant_id = $5 AND deleted_at IS NULL
       RETURNING id, tenant_id, name, email, address, created_at`,
      [name ?? null, email !== undefined ? (email ?? null) : undefined, address !== undefined ? (address ?? null) : undefined, id, tenantId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Client updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/clients/:id
// Soft-deletes a client for the authenticated user's tenant.
// ---------------------------------------------------------------------------

export async function deleteClient(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;

    const existing = await query<Client>(
      'SELECT id FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    if (existing.rows.length === 0) {
      throw new AppError('Client not found.', 404);
    }

    await query(
      'UPDATE clients SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'Client deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
