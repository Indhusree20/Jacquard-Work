import { Router } from 'express';
import { createPaymentRecord, getPayments } from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', createPaymentRecord);
router.get('/', getPayments);

export default router;
