// =============================================================================
// Auth Routes — Register, Login, Profile
// =============================================================================

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/register  — Create tenant + admin user
router.post('/register', register);

// POST /api/auth/login     — Authenticate and receive JWT
router.post('/login', login);

// GET /api/auth/me         — Get current user profile (protected)
router.get('/me', authenticate, getMe);

export default router;
