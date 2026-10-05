import { Router } from 'express';
import {
  getServices,
  getServiceById,
  calculatePricingPreview,
  calculateItemsPreview,
  listAdminServices,
  createService,
  updateService,
  toggleServiceStatus
} from '../controllers/serviceController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requirePermission } from '../middlewares/permission';

const router = Router();

// Public / Authenticated catalog endpoints
router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/calculate-price', calculatePricingPreview);
router.post('/calculate-items', calculateItemsPreview);

// Admin-only management endpoints
router.get(
  '/admin/list',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  listAdminServices
);

router.post(
  '/admin',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  createService
);

router.patch(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  updateService
);

router.patch(
  '/admin/:id/status',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  toggleServiceStatus
);

export default router;
