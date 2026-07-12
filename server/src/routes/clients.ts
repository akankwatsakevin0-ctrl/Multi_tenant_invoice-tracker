// =============================================================================
// Client Routes — CRUD with multi-tenant isolation
// =============================================================================

import { Router } from 'express';
import { getClients, createClient } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClientSchema } from '../validators';

const router = Router();

// All client routes require authentication
router.use(authenticate);

// GET  /api/clients     — List clients for the tenant
router.get('/', getClients);

// POST /api/clients     — Create a new client
router.post('/', validate(createClientSchema), createClient);

export default router;
