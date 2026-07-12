// =============================================================================
// Client Routes — CRUD with multi-tenant isolation
// =============================================================================

import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../validators';

const router = Router();

// All client routes require authentication
router.use(authenticate);

// GET    /api/clients       — List clients for the tenant
router.get('/', getClients);

// POST   /api/clients       — Create a new client
router.post('/', validate(createClientSchema), createClient);

// PATCH  /api/clients/:id   — Update a client
router.patch('/:id', validate(updateClientSchema), updateClient);

// DELETE /api/clients/:id   — Soft-delete a client
router.delete('/:id', deleteClient);

export default router;
