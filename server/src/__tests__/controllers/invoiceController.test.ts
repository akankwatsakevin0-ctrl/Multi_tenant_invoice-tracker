import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query, transaction } = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  transaction: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('../../config/database', () => ({
  query,
  transaction,
  default: {},
}));

import { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice } from '../../controllers/invoiceController';

function mockReq(body?: any, user?: any, params?: any, queryParams?: any) {
  return { body: body || {}, user: user || { tenant_id: 'tenant-1', user_id: 'user-1' }, params: params || {}, query: queryParams || {} } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('getInvoices', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns paginated invoices', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
    query.mockResolvedValueOnce({
      rows: [
        { id: 'i1', client_name: 'A', amount: 100, status: 'paid', tenant_id: 'tenant-1', deleted_at: null },
        { id: 'i2', client_name: 'B', amount: 200, status: 'draft', tenant_id: 'tenant-1', deleted_at: null },
      ],
    });

    const res = mockRes();
    await getInvoices(mockReq({}, undefined, {}, { page: 1, limit: 20 }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, pagination: expect.objectContaining({ page: 1, limit: 20, total: 2 }) })
    );
  });

  it('filters by status', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'i1', client_name: 'A', amount: 100, status: 'paid' }] });

    const res = mockRes();
    await getInvoices(mockReq({}, undefined, {}, { status: 'paid', page: '1', limit: '20' }), res, vi.fn());
    expect(res.json).toHaveBeenCalled();
  });
});

describe('getInvoice', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns invoice with items', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'inv-1', client_name: 'A', client_email: 'a@test.com', tenant_id: 'tenant-1', deleted_at: null }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'item-1', description: 'Service', quantity: 1, unit_price: 100, total: 100 }] });

    const res = mockRes();
    await getInvoice(mockReq({}, undefined, { id: 'inv-1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ id: 'inv-1' }) })
    );
  });

  it('returns 404 when invoice not found', async () => {
    const next = vi.fn();
    await getInvoice(mockReq({}, undefined, { id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Invoice not found.');
  });
});

describe('createInvoice', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue({ rows: [] });
    transaction.mockReset();
    transaction.mockImplementation((fn: any) => {
      const mockTx = vi.fn();
      mockTx.mockResolvedValue({ rows: [{ id: 'tx-result' }] });
      return fn(mockTx);
    });
  });

  it('creates invoice with items', async () => {
    const req = mockReq({ client_id: 'client-1', due_date: '2024-12-31', currency: 'USD', items: [{ description: 'Work', quantity: 10, unit_price: 150 }] });
    const res = mockRes();
    const next = vi.fn();

    query.mockResolvedValueOnce({ rows: [{ id: 'client-1' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'item-1', description: 'Work', quantity: 10, unit_price: 150, total: 1500 }] });

    await createInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when client not found for tenant', async () => {
    const next = vi.fn();
    await createInvoice(mockReq({ client_id: 'nonexistent', due_date: '2024-12-31', currency: 'USD', status: 'draft', items: [{ description: 'T', quantity: 1, unit_price: 100 }] }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Client not found.');
  });


});

describe('updateInvoice', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue({ rows: [] });
    transaction.mockReset();
    transaction.mockImplementation((fn: any) => {
      const mockTx = vi.fn();
      mockTx.mockResolvedValue({ rows: [{ id: 'inv-1', status: 'paid' }] });
      return fn(mockTx);
    });
  });

  it('updates invoice status', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'inv-1' }] });
    query.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await updateInvoice(mockReq({ status: 'paid' }, undefined, { id: 'inv-1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when invoice not found', async () => {
    const next = vi.fn();
    await updateInvoice(mockReq({ status: 'paid' }, undefined, { id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Invoice not found.');
  });
});

describe('deleteInvoice', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('soft-deletes an invoice', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'inv-1' }] });

    const res = mockRes();
    await deleteInvoice(mockReq({}, undefined, { id: 'inv-1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Invoice deleted successfully.' }));
  });

  it('returns 404 when invoice not found', async () => {
    const next = vi.fn();
    await deleteInvoice(mockReq({}, undefined, { id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Invoice not found.');
  });
});
