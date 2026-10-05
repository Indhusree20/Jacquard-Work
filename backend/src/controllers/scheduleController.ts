import { Response, NextFunction } from 'express';
import { WorkRequest } from '../models/WorkRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

export const getWorkerSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'JACQUARD_WORKER' && req.user.role !== 'ADMIN' && req.user.role !== 'PRIMARY_ADMIN')) {
      res.status(403).json({ success: false, message: 'Only Jacquard Workers / Masters can access their schedule.' });
      return;
    }

    const workerId = req.user.role === 'JACQUARD_WORKER' ? req.user._id : req.query.workerId;

    if (!workerId) {
      res.status(400).json({ success: false, message: 'Worker ID is required.' });
      return;
    }

    const { status, startDate, endDate } = req.query;

    // Strict ownership & confirmed acceptance filter:
    // A job appears ONLY when assigned to this worker AND user has accepted final charges
    const query: any = {
      assignedWorkerId: workerId,
      status: { $in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
      'finalChargeSnapshot.userConfirmedAt': { $exists: true }
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (startDate && endDate) {
      query['finalChargeSnapshot.selectedDate'] = {
        $gte: startDate as string,
        $lte: endDate as string
      };
    }

    const requests = await WorkRequest.find(query)
      .populate('weaverId', 'name email phone businessName loomCount location')
      .populate('serviceId', 'name category code')
      .sort({ 'finalChargeSnapshot.selectedDate': 1, requiredDate: 1, createdAt: -1 });

    const worker = await User.findById(workerId).select('name isAvailable phone location specialization experienceYears');

    res.status(200).json({
      success: true,
      data: {
        worker,
        requests,
        jobs: requests // backward compatibility alias
      }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'JACQUARD_WORKER') {
      res.status(403).json({ success: false, message: 'Only Jacquard Workers can set availability.' });
      return;
    }

    const { isAvailable } = req.body;
    const worker = await User.findByIdAndUpdate(
      req.user._id,
      { isAvailable: Boolean(isAvailable) },
      { new: true }
    ).select('-passwordHash');

    await recordAuditLog(req, 'UPDATE_AVAILABILITY', 'User', req.user._id.toString(), { isAvailable });

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'Available' : 'Busy / Off Duty'}.`,
      data: { user: worker }
    });
  } catch (error) {
    next(error);
  }
};
