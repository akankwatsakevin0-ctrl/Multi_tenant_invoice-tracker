import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query } = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('../../config/database', () => ({ query, transaction: vi.fn(), default: {} }));

import { getStats } from '../../controllers/dashboardController';

function mockReq(user?: any) { return { user: user || { tenant_id: 'tenant-1' } } as any; }
function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('getStats', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns dashboard stats', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ count: '5', total_amount: '15000' }] })
      .mockResolvedValueOnce({ rows: [{ status: 'paid', count: '3', amount: '10000' }, { status: 'draft', count: '2', amount: '5000' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'i1', client_name: 'A', amount: 5000, status: 'paid' }] });

    const res = mockRes();
    await getStats(mockReq(), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ total_invoices: 5, total_amount: 15000 }),
      })
    );
  });

  it('returns zeros when no invoices', async () => {
    const res = mockRes();
    await getStats(mockReq(), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ total_invoices: 0, total_amount: 0 }) })
    );
  });
});
