// =============================================================================
// Auth Routes — Register, Login, Profile
// =============================================================================

import { Router } from 'express';
import { register, login, getMe, refresh, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators';

const router = Router();

// POST /api/auth/register  — Create tenant + admin user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login     — Authenticate and receive JWT
router.post('/login', validate(loginSchema), login);

// POST /api/auth/refresh   — Exchange refresh token for new token pair
router.post('/refresh', validate(refreshTokenSchema), refresh);

// POST /api/auth/logout    — Revoke refresh token
router.post('/logout', logout);

// GET /api/auth/me         — Get current user profile (protected)
router.get('/me', authenticate, getMe);

export default router;
