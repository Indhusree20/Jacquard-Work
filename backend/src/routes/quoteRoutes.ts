import { Router } from 'express';
import { submitQuote, respondToQuote } from '../controllers/quoteController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', submitQuote);
router.patch('/:id/respond', respondToQuote);

export default router;
