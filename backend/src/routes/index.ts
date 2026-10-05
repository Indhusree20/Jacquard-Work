import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import serviceRoutes from './serviceRoutes';
import workTypeRoutes from './workTypeRoutes';
import workRequestRoutes from './workRequestRoutes';
import quoteRoutes from './quoteRoutes';
import jobRoutes from './jobRoutes';
import scheduleRoutes from './scheduleRoutes';
import paymentRoutes from './paymentRoutes';
import notificationRoutes from './notificationRoutes';
import reportRoutes from './reportRoutes';
import districtRoutes from './districtRoutes';
import paymentReportRoutes from './paymentReportRoutes';
import { calculatePricingPreview, calculateItemsPreview } from '../controllers/serviceController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/payment-reports', paymentReportRoutes);
router.use('/payment-reports', paymentReportRoutes);
router.use('/services', serviceRoutes);
router.use('/districts', districtRoutes);
router.use('/work-types', workTypeRoutes);
router.use('/work-requests', workRequestRoutes);
router.use('/quotes', quoteRoutes);
router.use('/jobs', jobRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

// Dedicated /pricing/calculate & calculate-items endpoints
router.post('/pricing/calculate', calculatePricingPreview);
router.post('/pricing/calculate-items', calculateItemsPreview);

export default router;

