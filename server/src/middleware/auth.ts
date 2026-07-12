// =============================================================================
// JWT Authentication Middleware
// =============================================================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { AuthenticatedRequest, AuthPayload, ApiResponse, RefreshToken } from '../types';
import { ENV } from '../config/env';

// ---------------------------------------------------------------------------
// JWT configuration
// ---------------------------------------------------------------------------

const JWT_SECRET = ENV.JWT_SECRET;
const JWT_EXPIRES_IN = ENV.JWT_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES_IN_MS = parseDuration(ENV.REFRESH_TOKEN_EXPIRES_IN);

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export interface JwtTokenPayload {
  user_id: string;
  tenant_id: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Generate a JWT token
// ---------------------------------------------------------------------------

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(
    {
      user_id: payload.user_id,
      tenant_id: payload.tenant_id,
      role: payload.role,
      email: payload.email,
    },
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

// ---------------------------------------------------------------------------
// Verify a JWT token and return the decoded payload
// ---------------------------------------------------------------------------

export function verifyToken(token: string): JwtTokenPayload {
  return jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
}

// ---------------------------------------------------------------------------
// Refresh Token — generate, store, verify, revoke
// ---------------------------------------------------------------------------

export async function generateRefreshToken(user_id: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires_at = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS).toISOString();

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user_id, token_hash, expires_at]
  );

  return token;
}

export async function verifyRefreshToken(token: string): Promise<{ user_id: string; token_id: string }> {
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await query<RefreshToken>(
    `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
    [token_hash]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid refresh token.');
  }

  const rt = result.rows[0];

  if (rt.revoked_at) {
    throw new Error('Refresh token has been revoked.');
  }

  if (new Date(rt.expires_at) < new Date()) {
    throw new Error('Refresh token has expired.');
  }

  return { user_id: rt.user_id, token_id: rt.id };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');

  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [token_hash]
  );
}

export async function revokeAllUserRefreshTokens(user_id: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [user_id]
  );
}

// ---------------------------------------------------------------------------
// Authentication middleware — extracts & verifies the Bearer token
// ---------------------------------------------------------------------------

export function authenticate(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization header format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      user_id: decoded.user_id,
      tenant_id: decoded.tenant_id,
      role: decoded.role as AuthPayload['role'],
      email: decoded.email,
    };
    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? 'Token has expired. Please log in again.'
        : 'Invalid token.';
    res.status(401).json({ success: false, error: message });
  }
}

// ---------------------------------------------------------------------------
// Role-based authorization guard
// ---------------------------------------------------------------------------

export function authorize(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
