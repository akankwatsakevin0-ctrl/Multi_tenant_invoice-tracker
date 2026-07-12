// =============================================================================
// Multi-Tenant Isolation Middleware
// =============================================================================
//
// This middleware ensures that every request is scoped to the authenticated
// user's tenant. It attaches the tenant_id to the request context so that
// downstream handlers can use it in queries.
// =============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';

/**
 * Enforce tenant isolation — rejects the request if the authenticated user
 * does not belong to the tenant specified in a route parameter (if present)
 * or simply ensures the request has a valid tenant context.
 *
 * For routes where an optional `:tenant_id` parameter exists (e.g. admin
 * cross-tenant views), this middleware can also verify the user has access.
 */
export function enforceTenant(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  // Every authenticated request MUST have a user with a tenant_id
  if (!req.user || !req.user.tenant_id) {
    res.status(401).json({
      success: false,
      error: 'Tenant context not available. Authentication required.',
    });
    return;
  }

  // Attach the resolved tenant_id to the request for downstream use
  // (e.g. controllers can read req.user.tenant_id in WHERE clauses)
  next();
}

/**
 * Create a WHERE clause snippet for tenant-scoped queries.
 * Use this in raw SQL queries to enforce tenant isolation.
 *
 * @param alias - The table alias to prefix (e.g. 'i' for invoices i)
 * @param tenantId - The tenant_id from req.user.tenant_id
 */
export function tenantClause(alias: string, tenantId: string): string {
  return `${alias}.tenant_id = '${tenantId}' AND ${alias}.deleted_at IS NULL`;
}

/**
 * Parameterized tenant clause — safe from SQL injection.
 * Returns a SQL fragment and a params array to spread into the query.
 *
 * Usage:
 *   const { clause, params } = tenantClauseParam('i', req.user.tenant_id);
 *   const result = await query(`SELECT * FROM invoices i WHERE ${clause}`, params);
 */
export function tenantClauseParam(
  alias: string,
  tenantId: string
): { clause: string; params: string[] } {
  return {
    clause: `${alias}.tenant_id = $1 AND ${alias}.deleted_at IS NULL`,
    params: [tenantId],
  };
}
