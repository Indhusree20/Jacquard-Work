import { Router } from 'express';
import {
  createWorkRequest,
  getWorkRequests,
  getWorkRequestById,
  cancelWorkRequest,
  completeWorkRequest,
  updatePaymentStatus,
  masterAcceptAndSetFinalCharges,
  userConfirmFinalCharges,
  checkAndExpirePendingConfirmations
} from '../controllers/workRequestController';
import { authenticate } from '../middlewares/auth';
import { uploadDesignFiles } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

router.post('/', uploadDesignFiles.array('designFiles', 5), createWorkRequest);
router.get('/', getWorkRequests);
router.post('/check-expirations', checkAndExpirePendingConfirmations);
router.get('/:id', getWorkRequestById);
router.patch('/:id/cancel', cancelWorkRequest);
router.post('/:id/complete', completeWorkRequest);
router.patch('/:id/payment-status', updatePaymentStatus);
router.post('/:id/master-charges', masterAcceptAndSetFinalCharges);
router.post('/:id/user-confirm-final', userConfirmFinalCharges);

export default router;

