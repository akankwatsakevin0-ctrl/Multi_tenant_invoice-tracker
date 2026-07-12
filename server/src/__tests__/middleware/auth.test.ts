import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, authenticate, authorize } from '../../middleware/auth';

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
