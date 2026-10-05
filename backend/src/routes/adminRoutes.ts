import { Router } from 'express';
import {
  getDashboardStats,
  createAdmin,
  listAdmins,
  updateAdminPermissions,
  toggleAdminStatus,
  listUsers,
  toggleUserStatus
} from '../controllers/adminController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'PRIMARY_ADMIN'));

router.get('/stats', getDashboardStats);
router.post('/admins', createAdmin); // PRIMARY_ADMIN enforced in controller
router.get('/admins', requirePermission('MANAGE_ADMINS'), listAdmins);
router.patch('/admins/:id/permissions', updateAdminPermissions);
router.patch('/admins/:id/status', toggleAdminStatus);

router.get('/users', requirePermission('MANAGE_USERS'), listUsers);
router.patch('/users/:id/status', requirePermission('MANAGE_USERS'), toggleUserStatus);

export default router;
