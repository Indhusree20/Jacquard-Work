import { Router } from 'express';
import { getJobs, getJobById, updateJobStatus, submitFeedback } from '../controllers/jobController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getJobs);
router.get('/:id', getJobById);
router.patch('/:id/status', updateJobStatus);
router.post('/:id/feedback', submitFeedback);

export default router;
