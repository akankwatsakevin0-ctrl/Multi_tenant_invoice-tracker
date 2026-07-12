// =============================================================================
// Auth Controller — Register & Login
// =============================================================================

import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database';
import { generateToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  User,
  Tenant,
} from '../types';

const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Creates a new tenant AND a new admin user in one transaction.
// ---------------------------------------------------------------------------

export async function register(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, tenant_name, tenant_currency } = req.body as { email: string; password: string; tenant_name: string; tenant_currency: string };

    // Check for existing user
    const existing = await query<User>(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('A user with this email already exists.', 409);
    }

    // --- Create tenant + user atomically ---
    const result = await transaction(async (tx) => {
      // 1. Create tenant
      const tenantRes = await tx<Tenant>(
        `INSERT INTO tenants (name, currency_default)
         VALUES ($1, $2)
         RETURNING id, name, address, currency_default, created_at`,
        [tenant_name, tenant_currency]
      );
      const tenant = tenantRes.rows[0];

      // 2. Hash password
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // 3. Create admin user for this tenant
      const userRes = await tx<User>(
        `INSERT INTO users (email, password_hash, tenant_id, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, email, tenant_id, role, created_at`,
        [email, password_hash, tenant.id]
      );
      const user = userRes.rows[0];

      return { tenant, user };
    });

    // 4. Generate tokens
    const token = generateToken({
      user_id: result.user.id,
      tenant_id: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

    const refresh_token = await generateRefreshToken(result.user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        refresh_token,
        user: {
          id: result.user.id,
          email: result.user.email,
          tenant_id: result.user.tenant_id,
          role: result.user.role,
          created_at: result.user.created_at,
          deleted_at: result.user.deleted_at,
        },
      },
      message: 'Tenant and admin user created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Validates credentials and returns a JWT token.
// ---------------------------------------------------------------------------

export async function login(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // Find user
    const userRes = await query<User>(
      `SELECT id, email, password_hash, tenant_id, role, created_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Invalid email or password.', 401);
    }

    const user = userRes.rows[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Generate tokens
    const token = generateToken({
      user_id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    const refresh_token = await generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id,
          role: user.role,
          created_at: user.created_at,
          deleted_at: user.deleted_at,
        },
      },
      message: 'Login successful.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// Returns the currently authenticated user's profile.
// ---------------------------------------------------------------------------

export async function getMe(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userRes = await query<User>(
      `SELECT id, email, tenant_id, role, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [req.user!.user_id]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    res.json({
      success: true,
      data: userRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// Validates a refresh token and issues a new access + refresh token pair.
// ---------------------------------------------------------------------------

export async function refresh(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body as { refresh_token: string };

    const { user_id } = await verifyRefreshToken(refresh_token);

    // Revoke the old refresh token (rotation)
    await revokeRefreshToken(refresh_token);

    const userRes = await query<User>(
      `SELECT id, email, tenant_id, role FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [user_id]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('User not found.', 404);
    }

    const user = userRes.rows[0];

    const token = generateToken({
      user_id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    const new_refresh_token = await generateRefreshToken(user.id);

    res.json({
      success: true,
      data: { token, refresh_token: new_refresh_token },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('refresh token')) {
      return next(new AppError(err.message, 401));
    }
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// Revokes the provided refresh token.
// ---------------------------------------------------------------------------

export async function logout(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body as { refresh_token: string };

    if (refresh_token) {
      await revokeRefreshToken(refresh_token);
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}
