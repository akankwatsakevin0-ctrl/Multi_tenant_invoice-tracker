// =============================================================================
// Invoice Routes — CRUD with multi-tenant isolation
// =============================================================================

import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, invoiceQuerySchema } from '../validators';

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

// GET    /api/invoices      — List invoices (with optional ?status= & ?currency= filters)
router.get('/', validate(invoiceQuerySchema, 'query'), getInvoices);

// GET    /api/invoices/:id  — Get single invoice with line items
router.get('/:id', getInvoice);

// POST   /api/invoices      — Create invoice with line items
router.post('/', validate(createInvoiceSchema), createInvoice);

// PUT    /api/invoices/:id  — Update invoice (and optionally replace items)
router.put('/:id', validate(updateInvoiceSchema), updateInvoice);

// DELETE /api/invoices/:id  — Soft-delete invoice
router.delete('/:id', deleteInvoice);

export default router;
