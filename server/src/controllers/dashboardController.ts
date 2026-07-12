// =============================================================================
// Dashboard Controller — Aggregate stats for the authenticated tenant
// =============================================================================

import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import {
  AuthenticatedRequest,
  ApiResponse,
  DashboardStats,
  InvoiceStatus,
} from '../types';

// ---------------------------------------------------------------------------
// GET /api/dashboard/stats
// Returns aggregated invoice statistics for the user's tenant.
// ---------------------------------------------------------------------------

export async function getStats(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<DashboardStats>>,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user!.tenant_id;

    // --- Total invoice count & total amount ---
    const totalsRes = await query<{ count: string; total_amount: string }>(
      `SELECT COUNT(*)::text as count, COALESCE(SUM(amount), 0)::text as total_amount
       FROM invoices
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    );
    const totalInvoices = parseInt(totalsRes.rows[0]?.count || '0', 10);
    const totalAmount = parseFloat(totalsRes.rows[0]?.total_amount || '0');

    // --- Breakdown by status ---
    const byStatusRes = await query<{ status: InvoiceStatus; count: string; amount: string }>(
      `SELECT status, COUNT(*)::text as count, COALESCE(SUM(amount), 0)::text as amount
       FROM invoices
       WHERE tenant_id = $1 AND deleted_at IS NULL
       GROUP BY status`,
      [tenantId]
    );

    const statusDefaults: Record<InvoiceStatus, { count: number; amount: number }> = {
      draft: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
    };

    for (const row of byStatusRes.rows) {
      statusDefaults[row.status] = {
        count: parseInt(row.count, 10),
        amount: parseFloat(row.amount),
      };
    }

    // --- Recent 5 invoices with client name ---
    const recentRes = await query(
      `SELECT i.*, c.name as client_name
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        total_amount: totalAmount,
        currency: 'Mixed',
        by_status: statusDefaults,
        recent_invoices: recentRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}
