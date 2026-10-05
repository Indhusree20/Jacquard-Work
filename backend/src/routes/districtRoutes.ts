import { Router } from 'express';
import {
  getActiveDistricts,
  getAdminDistricts,
  activateDistricts,
  deactivateDistrict,
  toggleDistrictStatus,
  createDistrict
} from '../controllers/districtController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requirePermission } from '../middlewares/permission';

const router = Router();

// Public & User Endpoint: Get currently active districts only
router.get('/', getActiveDistricts);
router.get('/active', getActiveDistricts);

// Admin Management Endpoints
router.get(
  '/admin/list',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_DISTRICTS'),
  getAdminDistricts
);

router.post(
  '/admin/activate',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_DISTRICTS'),
  activateDistricts
);

router.post(
  '/admin/deactivate',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_DISTRICTS'),
  deactivateDistrict
);

router.patch(
  '/admin/:id/status',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_DISTRICTS'),
  toggleDistrictStatus
);

router.post(
  '/admin',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_DISTRICTS'),
  createDistrict
);

export default router;
