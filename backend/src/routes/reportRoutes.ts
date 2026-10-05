import { Router } from 'express';
import { getPlatformReports } from '../controllers/reportController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';
import { requirePermission } from '../middlewares/permission';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'PRIMARY_ADMIN'));
router.get('/', requirePermission('VIEW_REPORTS'), getPlatformReports);

export default router;
