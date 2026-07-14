import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query } = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('../../config/database', () => ({ query, transaction: vi.fn(), default: {} }));

import { getClients, createClient, updateClient, deleteClient } from '../../controllers/clientController';

function mockReq(body?: any, user?: any, params?: any) { return { body: body || {}, user: user || { tenant_id: 'tenant-1' }, params: params || {} } as any; }
function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('getClients', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns list of clients', async () => {
    const clients = [
      { id: 'c1', tenant_id: 'tenant-1', name: 'A', email: 'a@t.com', address: null, created_at: '2024-01-01' },
      { id: 'c2', tenant_id: 'tenant-1', name: 'B', email: null, address: '123 St', created_at: '2024-01-02' },
    ];
    query.mockResolvedValueOnce({ rows: clients });

    const res = mockRes();
    await getClients(mockReq(), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ success: true, data: clients });
  });

  it('returns empty array when none', async () => {
    const res = mockRes();
    await getClients(mockReq(), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });
});

describe('createClient', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('creates and returns a new client', async () => {
    const created = { id: 'c3', tenant_id: 'tenant-1', name: 'New', email: 'n@t.com', address: null, created_at: '2024-06-01' };
    query.mockResolvedValueOnce({ rows: [created] });

    const res = mockRes();
    await createClient(mockReq({ name: 'New', email: 'n@t.com' }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created, message: 'Client created successfully.' });
  });

  it('creates client with empty string name (validation in middleware)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'c4', tenant_id: 'tenant-1', name: '', email: null, address: null, created_at: '2024-06-01' }] });
    const res = mockRes();
    await createClient(mockReq({ name: '' }), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('updateClient', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('updates a client', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'c1' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'c1', tenant_id: 'tenant-1', name: 'Updated', email: null, address: null, created_at: '2024-01-01' }] });

    const res = mockRes();
    await updateClient(mockReq({ name: 'Updated' }, undefined, { id: 'c1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when client not found', async () => {
    const next = vi.fn();
    await updateClient(mockReq({ name: 'Nope' }, undefined, { id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Client not found.');
  });
});

describe('deleteClient', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('soft-deletes a client', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'c1' }] });

    const res = mockRes();
    await deleteClient(mockReq({}, undefined, { id: 'c1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when client not found', async () => {
    const next = vi.fn();
    await deleteClient(mockReq({}, undefined, { id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Client not found.');
  });
});
