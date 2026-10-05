import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { WorkRequest } from '../models/WorkRequest';
import { Job } from '../models/Job';
import { Payment } from '../models/Payment';
import { AuthRequest } from '../middlewares/auth';

export const getPlatformReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. District-wise breakdown for Weavers and Jacquard Workers in Tamil Nadu
    const districtStats = await User.aggregate([
      {
        $match: {
          'location.district': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$location.district',
          weavers: {
            $sum: { $cond: [{ $eq: ['$role', 'WEAVER'] }, 1, 0] }
          },
          workers: {
            $sum: { $cond: [{ $eq: ['$role', 'JACQUARD_WORKER'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 2. Work Request status breakdown
    const requestStatusStats = await WorkRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimatedValue: { $sum: '$estimatedAmount' }
        }
      }
    ]);

    // 3. Job status breakdown & total revenue
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAgreedAmount: { $sum: '$totalAgreedAmount' }
        }
      }
    ]);

    // 4. Payment breakdown by method (UPI, Cash, Bank Transfer)
    const paymentMethodStats = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        districtStats,
        requestStatusStats,
        jobStats,
        paymentMethodStats
      }
    });
  } catch (error) {
    next(error);
  }
};
