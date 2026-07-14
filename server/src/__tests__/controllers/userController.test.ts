import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query } = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('../../config/database', () => ({ query, default: {} }));

import { getUsers, updateUser, deleteUser } from '../../controllers/userController';

function mockReq(params?: any, body?: any, user?: any) { return { params: params || {}, body: body || {}, user: user || { user_id: 'user-1', tenant_id: 'tenant-1', role: 'admin' } } as any; }
function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('getUsers', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns users for tenant', async () => {
    query.mockResolvedValueOnce({
      rows: [
        { id: 'u1', email: 'a@b.com', tenant_id: 'tenant-1', role: 'admin', created_at: '2024-01-01' },
        { id: 'u2', email: 'b@b.com', tenant_id: 'tenant-1', role: 'user', created_at: '2024-02-01' },
      ],
    });

    const res = mockRes();
    await getUsers(mockReq(), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(res.json.mock.calls[0][0].data).toHaveLength(2);
  });
});

describe('updateUser', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('updates user role', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'a@b.com', tenant_id: 'tenant-1', role: 'manager', created_at: '2024-01-01' }] });

    const res = mockRes();
    await updateUser(mockReq({ id: 'u1' }, { role: 'manager' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when user not found', async () => {
    const next = vi.fn();
    await updateUser(mockReq({ id: 'nonexistent' }, { role: 'admin' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('User not found.');
  });
});

describe('deleteUser', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('soft-deletes a user', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] });

    const res = mockRes();
    await deleteUser(mockReq({ id: 'u1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when user not found', async () => {
    const next = vi.fn();
    await deleteUser(mockReq({ id: 'nonexistent' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('User not found.');
  });
});
