import { Response, NextFunction } from 'express';
import { WorkRequest } from '../models/WorkRequest';
import { PaymentStatusHistory } from '../models/PaymentStatusHistory';
import { AuthRequest } from '../middlewares/auth';

export const getPaymentReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      paymentStatus,
      workStatus,
      workerId,
      district,
      serviceId,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query: any = {};

    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }

    if (workStatus && workStatus !== 'ALL') {
      query.status = workStatus;
    }

    if (workerId && workerId !== 'ALL') {
      query.assignedWorkerId = workerId;
    }

    if (district && district !== 'ALL') {
      query['location.district'] = district;
    }

    if (serviceId && serviceId !== 'ALL') {
      query.$or = [
        { serviceId },
        { 'items.serviceId': serviceId }
      ];
    }

    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      WorkRequest.find(query)
        .populate('weaverId', 'name email phone businessName location avatar')
        .populate('assignedWorkerId', 'name email phone specialization avatar experienceYears')
        .populate('serviceId')
        .populate('workTypeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        records,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUnpaidWorkSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. All completed unpaid work
    const completedUnpaidRequests = await WorkRequest.find({
      status: 'COMPLETED',
      paymentStatus: 'UNPAID'
    })
      .populate('weaverId', 'name email phone')
      .populate('assignedWorkerId', 'name email phone');

    const totalUnpaidCompletedJobs = completedUnpaidRequests.length;
    const totalOutstandingCompletedAmount = completedUnpaidRequests.reduce((sum, r) => {
      const amt = r.finalAmount || r.estimatedAmount || 0;
      return sum + amt;
    }, 0);

    // 2. All unpaid requests (including in-progress, requested, etc.)
    const allUnpaidRequests = await WorkRequest.find({
      paymentStatus: 'UNPAID',
      status: { $nin: ['CANCELLED', 'REJECTED'] }
    });

    const totalAllUnpaidJobs = allUnpaidRequests.length;
    const totalAllOutstandingAmount = allUnpaidRequests.reduce((sum, r) => {
      const amt = r.finalAmount || r.estimatedAmount || 0;
      return sum + amt;
    }, 0);

    // 3. Paid totals
    const paidRequests = await WorkRequest.find({
      paymentStatus: 'PAID'
    });

    const totalPaidJobs = paidRequests.length;
    const totalCollectedAmount = paidRequests.reduce((sum, r) => {
      return sum + (r.paidAmount || r.finalAmount || r.estimatedAmount || 0);
    }, 0);

    // 4. Group by district for completed unpaid
    const districtBreakdownMap = new Map<string, { count: number; amount: number }>();
    for (const reqItem of completedUnpaidRequests) {
      const dist = reqItem.location?.district || 'Unknown';
      const amt = reqItem.finalAmount || reqItem.estimatedAmount || 0;
      const current = districtBreakdownMap.get(dist) || { count: 0, amount: 0 };
      districtBreakdownMap.set(dist, {
        count: current.count + 1,
        amount: current.amount + amt
      });
    }

    const unpaidByDistrict = Array.from(districtBreakdownMap.entries()).map(([district, data]) => ({
      district,
      count: data.count,
      amount: data.amount
    }));

    // 5. Group by worker for completed unpaid
    const workerBreakdownMap = new Map<string, { workerName: string; count: number; amount: number }>();
    for (const reqItem of completedUnpaidRequests) {
      const worker = reqItem.assignedWorkerId as any;
      const workerId = worker?._id?.toString() || 'unassigned';
      const workerName = worker?.name || 'Unassigned';
      const amt = reqItem.finalAmount || reqItem.estimatedAmount || 0;
      const current = workerBreakdownMap.get(workerId) || { workerName, count: 0, amount: 0 };
      workerBreakdownMap.set(workerId, {
        workerName,
        count: current.count + 1,
        amount: current.amount + amt
      });
    }

    const unpaidByWorker = Array.from(workerBreakdownMap.entries()).map(([workerId, data]) => ({
      workerId,
      workerName: data.workerName,
      count: data.count,
      amount: data.amount
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUnpaidCompletedJobs,
          totalOutstandingCompletedAmount,
          totalAllUnpaidJobs,
          totalAllOutstandingAmount,
          totalPaidJobs,
          totalCollectedAmount,
          unpaidByDistrict,
          unpaidByWorker
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistoryByRequestId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const history = await PaymentStatusHistory.find({ requestId })
      .populate('workerId', 'name email phone')
      .populate('recordedBy', 'name role email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { history }
    });
  } catch (error) {
    next(error);
  }
};
