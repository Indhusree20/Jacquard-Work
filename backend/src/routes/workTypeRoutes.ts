import { Router } from 'express';
import {
  getWorkTypes,
  getWorkTypeById,
  createWorkType,
  updateWorkType,
  deleteWorkType
} from '../controllers/workTypeController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requirePermission } from '../middlewares/permission';

const router = Router();

// Publicly readable for registered weavers and workers
router.get('/', authenticate, getWorkTypes);
router.get('/:id', authenticate, getWorkTypeById);

// Admin-only management
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  createWorkType
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  updateWorkType
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'PRIMARY_ADMIN'),
  requirePermission('MANAGE_WORK_TYPES'),
  deleteWorkType
);

export default router;
