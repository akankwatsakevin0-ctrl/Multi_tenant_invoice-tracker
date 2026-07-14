import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const query = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
vi.mock('../../config/database', () => ({ query, default: {} }));

import { generateToken, verifyToken, authenticate, authorize, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../../middleware/auth';

function mockReq(headers?: Record<string, string>, user?: any) {
  return { headers: headers || {}, user } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('generateToken', () => {
  it('returns a valid JWT string', () => {
    const payload = {
      user_id: 'user-1',
      tenant_id: 'tenant-1',
      role: 'admin' as const,
      email: 'admin@test.com',
    };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('token decodes to correct payload', () => {
    const payload = {
      user_id: 'user-1',
      tenant_id: 'tenant-1',
      role: 'admin' as const,
      email: 'admin@test.com',
    };
    const token = generateToken(payload);
    const decoded = jwt.verify(token, 'test-jwt-secret') as any;
    expect(decoded.user_id).toBe('user-1');
    expect(decoded.tenant_id).toBe('tenant-1');
    expect(decoded.role).toBe('admin');
    expect(decoded.email).toBe('admin@test.com');
  });
});

describe('verifyToken', () => {
  it('decodes a valid token', () => {
    const payload = {
      user_id: 'user-1',
      tenant_id: 'tenant-1',
      role: 'admin' as const,
      email: 'admin@test.com',
    };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.user_id).toBe('user-1');
    expect(decoded.email).toBe('admin@test.com');
  });

  it('throws for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });
});

describe('authenticate', () => {
  it('returns 401 when no auth header', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Authentication required. No token provided.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for malformed auth header', () => {
    const req = mockReq({ authorization: 'NotBearer token' });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid authorization header format. Use: Bearer <token>',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for valid token', () => {
    const payload = {
      user_id: 'user-1',
      tenant_id: 'tenant-1',
      role: 'admin' as const,
      email: 'admin@test.com',
    };
    const token = generateToken(payload);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user!.user_id).toBe('user-1');
    expect(req.user!.tenant_id).toBe('tenant-1');
  });

  it('returns 401 for expired token', () => {
    const expiredToken = jwt.sign(
      { user_id: 'u1', tenant_id: 't1', role: 'admin', email: 'a@b.com' },
      'test-jwt-secret',
      { expiresIn: '0s' }
    );
    const req = mockReq({ authorization: `Bearer ${expiredToken}` });
    const res = mockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token has expired. Please log in again.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorize', () => {
  it('calls next() when role is allowed', () => {
    const req = mockReq({}, { user_id: 'u1', tenant_id: 't1', role: 'admin', email: 'a@b.com' });
    const res = mockRes();
    const next = vi.fn();

    const middleware = authorize('admin', 'manager');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 when role is not allowed', () => {
    const req = mockReq({}, { user_id: 'u1', tenant_id: 't1', role: 'user', email: 'a@b.com' });
    const res = mockRes();
    const next = vi.fn();

    const middleware = authorize('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Forbidden. Required roles: admin',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when no user on request', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    const middleware = authorize('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('generateRefreshToken', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns a hex string and inserts into DB', async () => {
    const token = await generateRefreshToken('user-1');

    expect(typeof token).toBe('string');
    expect(token.length).toBe(96);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO refresh_tokens'),
      [ 'user-1', expect.any(String), expect.any(String) ]
    );
  });
});

describe('verifyRefreshToken', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns user_id and token_id for valid token', async () => {
    const token = 'valid-refresh-token';
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    query.mockResolvedValueOnce({
      rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: '2099-01-01T00:00:00Z', revoked_at: null }],
    });

    const result = await verifyRefreshToken(token);
    expect(result).toEqual({ user_id: 'user-1', token_id: 'rt-1' });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [hash]);
  });

  it('throws for invalid token', async () => {
    await expect(verifyRefreshToken('nonexistent')).rejects.toThrow('Invalid refresh token.');
  });

  it('throws for revoked token', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: '2099-01-01T00:00:00Z', revoked_at: '2024-01-01T00:00:00Z' }],
    });
    await expect(verifyRefreshToken('revoked-token')).rejects.toThrow('has been revoked');
  });

  it('throws for expired token', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'rt-1', user_id: 'user-1', expires_at: '2020-01-01T00:00:00Z', revoked_at: null }],
    });
    await expect(verifyRefreshToken('expired-token')).rejects.toThrow('has expired');
  });
});

describe('revokeRefreshToken', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('updates revoked_at for the token', async () => {
    const token = 'token-to-revoke';
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    await revokeRefreshToken(token);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE refresh_tokens'),
      [hash]
    );
  });
});
