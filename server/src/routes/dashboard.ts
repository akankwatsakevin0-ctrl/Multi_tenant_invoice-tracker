// =============================================================================
// Dashboard Routes — Aggregate stats
// =============================================================================

import { Router } from 'express';
import { getStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/stats — Get aggregated invoice stats for the tenant
router.get('/stats', getStats);

export default router;
