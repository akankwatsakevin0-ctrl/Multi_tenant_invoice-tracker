// =============================================================================
// JWT Authentication Middleware
// =============================================================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthPayload, ApiResponse } from '../types';
import { ENV } from '../config/env';

// ---------------------------------------------------------------------------
// JWT configuration
// ---------------------------------------------------------------------------

const JWT_SECRET = ENV.JWT_SECRET;
const JWT_EXPIRES_IN = ENV.JWT_EXPIRES_IN;

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
