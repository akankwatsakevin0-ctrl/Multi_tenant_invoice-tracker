import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, User } from '../types';

export async function getUsers(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Omit<User, 'password_hash'>[]>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;

    const result = await query<Omit<User, 'password_hash'>>(
      `SELECT id, email, tenant_id, role, created_at
       FROM users
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<Omit<User, 'password_hash'>>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    const existing = await query<User>(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    if (existing.rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const result = await query<Omit<User, 'password_hash'>>(
      `UPDATE users SET role = COALESCE($1, role)
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING id, email, tenant_id, role, created_at`,
      [role || null, id, tenantId]
    );

    res.json({ success: true, data: result.rows[0], message: 'User updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;
    const { id } = req.params;

    const existing = await query<User>(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    if (existing.rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    await query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
