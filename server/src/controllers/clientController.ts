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
  CreateClientBody,
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
    const { name, email, address } = req.body as CreateClientBody;

    if (!name || name.trim().length === 0) {
      throw new AppError('Client name is required.', 400);
    }

    const result = await query<Client>(
      `INSERT INTO clients (tenant_id, name, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, name, email, address, created_at`,
      [tenantId, name.trim(), email || null, address || null]
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
