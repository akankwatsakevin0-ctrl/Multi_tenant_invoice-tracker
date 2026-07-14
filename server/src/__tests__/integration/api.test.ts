import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const query = vi.hoisted(() => vi.fn().mockResolvedValue({ rows: [] }));
const transaction = vi.hoisted(() => vi.fn());

vi.mock('../../config/database', () => ({ query, transaction, default: {} }));

const bcryptCompare = vi.hoisted(() => vi.fn());
vi.mock('bcryptjs', () => ({ default: { compare: bcryptCompare, hash: vi.fn() }, compare: bcryptCompare, hash: vi.fn() }));

import app from '../../app';

function adminToken(): string {
  return jwt.sign(
    { user_id: 'user-1', tenant_id: 'tenant-1', role: 'admin', email: 'admin@test.com' },
    'test-jwt-secret',
    { expiresIn: '1h' }
  );
}

describe('GET /api/health', () => {
  it('returns 200 with success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/register', () => {
  it('returns 400 when email is invalid (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', tenant_name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when password too short (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'short', tenant_name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 when email exists', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'exists@test.com', password: 'password123', tenant_name: 'Test' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('A user with this email already exists.');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns 401 for wrong password', async () => {
    bcryptCompare.mockResolvedValue(false);
    query.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'a@b.com', password_hash: 'hash', tenant_id: 't1', role: 'admin', created_at: '', deleted_at: null }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});

describe('GET /api/auth/me', () => {
  const token = adminToken();

  it('returns 200 with user data', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'user-1', email: 'admin@test.com', tenant_id: 'tenant-1', role: 'admin', created_at: '2024-01-01' }] });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refresh_token: 'invalid' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid refresh token.');
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns 200', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refresh_token: 'some-token' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/clients', () => {
  const token = adminToken();

  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns list of clients', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'c1', tenant_id: 'tenant-1', name: 'Client A', email: null, address: null, created_at: '2024-01-01' }],
    });

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/clients', () => {
  const token = adminToken();

  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns 201 for valid client', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'c1', tenant_id: 'tenant-1', name: 'New Client', email: null, address: null, created_at: '2024-06-01' }],
    });

    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Client' });
    expect(res.status).toBe(201);
  });

  it('returns 400 when name is empty (Zod)', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/invoices', () => {
  const token = adminToken();

  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns 400 when client_id is missing (Zod)', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ due_date: '2024-12-31', items: [{ description: 'Test', quantity: 1, unit_price: 100 }] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/invoices', () => {
  const token = adminToken();

  beforeEach(() => { query.mockReset(); query.mockResolvedValue({ rows: [] }); });

  it('returns paginated invoices', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    query.mockResolvedValueOnce({
      rows: [{ id: 'i1', client_name: 'A', amount: 100, status: 'paid', tenant_id: 'tenant-1', deleted_at: null }],
    });

    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/convert', () => {
  it('returns 400 without params', async () => {
    const res = await request(app).get('/api/convert');
    expect(res.status).toBe(400);
  });

  it('converts USD to EUR', async () => {
    const res = await request(app).get('/api/convert?amount=100&from=USD&to=EUR');
    expect(res.status).toBe(200);
    expect(res.body.data.result).toBeTypeOf('number');
    expect(res.body.data.amount).toBe(100);
  });
});

describe('GET /api/docs', () => {
  it('returns swagger UI HTML', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
