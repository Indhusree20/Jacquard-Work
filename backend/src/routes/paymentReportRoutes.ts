import { Router } from 'express';
import {
  getPaymentReports,
  getUnpaidWorkSummary,
  getPaymentHistoryByRequestId
} from '../controllers/paymentReportController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/role';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'PRIMARY_ADMIN'));

router.get('/', getPaymentReports);
router.get('/unpaid-summary', getUnpaidWorkSummary);
router.get('/:requestId/history', getPaymentHistoryByRequestId);

export default router;
