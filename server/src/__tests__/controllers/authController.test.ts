import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query, transaction } = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  transaction: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('../../config/database', () => ({ query, transaction, default: {} }));

const { bcryptCompare, bcryptHash } = vi.hoisted(() => ({
  bcryptCompare: vi.fn(),
  bcryptHash: vi.fn().mockResolvedValue('hashed-password'),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: bcryptHash, compare: bcryptCompare },
  hash: bcryptHash,
  compare: bcryptCompare,
}));

import { register, login, getMe } from '../../controllers/authController';

function mockReq(body?: any, user?: any) { return { body: body || {}, user } as any; }
function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('register', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); transaction.mockReset(); });

  it('returns 201 and creates tenant + user', async () => {
    const req = mockReq({ email: 'new@test.com', password: 'password123', tenant_name: 'New Corp' });
    const res = mockRes();
    const next = vi.fn();

    const mockTx = vi.fn();
    mockTx
      .mockResolvedValueOnce({ rows: [{ id: 'tenant-1', name: 'New Corp', currency_default: 'USD' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'new@test.com', tenant_id: 'tenant-1', role: 'admin', created_at: '2024-01-01' }] });
    transaction.mockImplementationOnce(async (fn: any) => fn(mockTx));

    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 400 when required fields are missing', async () => {
    const next = vi.fn();
    await register(mockReq({ email: 'only-email@test.com' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('email, password, and tenant_name are required.');
  });

  it('returns 400 when password too short', async () => {
    const next = vi.fn();
    await register(mockReq({ email: 't@t.com', password: 'short', tenant_name: 'T' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Password must be at least 8 characters.');
  });

  it('returns 409 when email exists', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });
    const next = vi.fn();
    await register(mockReq({ email: 'existing@test.com', password: 'password123', tenant_name: 'T' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('A user with this email already exists.');
  });
});

describe('login', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns token and user for valid credentials', async () => {
    bcryptCompare.mockResolvedValue(true);
    query.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'user@test.com', password_hash: 'hashed', tenant_id: 'tenant-1', role: 'admin', created_at: '2024-01-01', deleted_at: null }],
    });

    const res = mockRes();
    await login(mockReq({ email: 'user@test.com', password: 'password123' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Login successful.' }));
  });

  it('returns 401 for wrong password', async () => {
    bcryptCompare.mockResolvedValue(false);
    query.mockResolvedValueOnce({
      rows: [{ id: 'user-1', email: 'user@test.com', password_hash: 'hashed', tenant_id: 'tenant-1', role: 'admin' }],
    });

    const next = vi.fn();
    await login(mockReq({ email: 'user@test.com', password: 'wrong' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('Invalid email or password.');
  });

  it('returns 400 when missing fields', async () => {
    const next = vi.fn();
    await login(mockReq({}), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('email and password are required.');
  });
});

describe('getMe', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns user profile', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'user@test.com', tenant_id: 'tenant-1', role: 'admin', created_at: '2024-01-01' }] });

    const res = mockRes();
    await getMe(mockReq({}, { user_id: 'user-1', tenant_id: 'tenant-1' }), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when user not found', async () => {
    const next = vi.fn();
    await getMe(mockReq({}, { user_id: 'nonexistent', tenant_id: 'tenant-1' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe('User not found.');
  });
});
