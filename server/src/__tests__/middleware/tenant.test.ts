import { describe, it, expect, vi } from 'vitest';
import { enforceTenant, tenantClause, tenantClauseParam } from '../../middleware/tenant';

function mockReq(user?: { tenant_id?: string }) {
  return { user: user || undefined } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('enforceTenant', () => {
  it('calls next() when tenant_id exists', () => {
    const req = mockReq({ tenant_id: 'tenant-123' });
    const res = mockRes();
    const next = vi.fn();

    enforceTenant(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when user is missing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    enforceTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Tenant context not available. Authentication required.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when tenant_id is missing', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    enforceTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('tenantClause', () => {
  it('generates SQL clause with tenant_id and deleted_at', () => {
    const clause = tenantClause('i', 'tenant-123');
    expect(clause).toBe("i.tenant_id = 'tenant-123' AND i.deleted_at IS NULL");
  });
});

describe('tenantClauseParam', () => {
  it('generates parameterized SQL clause', () => {
    const result = tenantClauseParam('i', 'tenant-123');
    expect(result.clause).toBe('i.tenant_id = $1 AND i.deleted_at IS NULL');
    expect(result.params).toEqual(['tenant-123']);
  });
});
