import { Router } from 'express';
import { getWorkerSchedule, toggleAvailability } from '../controllers/scheduleController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getWorkerSchedule);
router.patch('/availability', toggleAvailability);

export default router;
