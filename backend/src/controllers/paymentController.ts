import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Payment } from '../models/Payment';
import { Job } from '../models/Job';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';
import { SocketService } from '../services/SocketService';

const createPaymentSchema = z.object({
  jobId: z.string().min(1),
  amount: z.number().min(1),
  status: z.enum(['PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED']).default('PAID'),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']).default('UPI'),
  transactionReference: z.string().optional(),
  notes: z.string().optional()
});

const generatePaymentId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Payment.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `PAY-${currentYear}-${sequence}`;
};

export const createPaymentRecord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createPaymentSchema.parse(req.body);

    const job = await Job.findById(validatedData.jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found.' });
      return;
    }

    const paymentId = await generatePaymentId();
    const payment = await Payment.create({
      paymentId,
      jobId: job._id,
      requestId: job.requestId,
      weaverId: job.weaverId,
      workerId: job.workerId,
      amount: validatedData.amount,
      status: validatedData.status,
      method: validatedData.method,
      transactionReference: validatedData.transactionReference,
      notes: validatedData.notes,
      paidAt: validatedData.status === 'PAID' ? new Date() : undefined
    });

    // Update job payment status
    job.paymentStatus = validatedData.status === 'PAID' ? 'PAID' : 'PARTIALLY_PAID';
    await job.save();

    await recordAuditLog(req, 'RECORD_PAYMENT', 'Payment', payment._id.toString(), {
      paymentId,
      amount: validatedData.amount,
      status: validatedData.status
    });

    // Notify Weaver and Worker
    SocketService.emitToUser(job.workerId.toString(), 'PAYMENT_RECORDED', {
      paymentId,
      amount: validatedData.amount,
      status: validatedData.status
    });

    await Notification.create({
      userId: job.workerId,
      title: {
        en: `Payment Logged: ₹${validatedData.amount}`,
        ta: `கட்டணம் பதிவு செய்யப்பட்டது: ₹${validatedData.amount}`
      },
      message: {
        en: `Payment of ₹${validatedData.amount} (${validatedData.method}) has been recorded for Job ${job.jobId}.`,
        ta: `பணி ${job.jobId}-க்கு ₹${validatedData.amount} கட்டணம் பதிவு செய்யப்பட்டுள்ளது.`
      },
      type: 'PAYMENT_RECORDED',
      link: `/worker/charges`
    });

    res.status(201).json({
      success: true,
      message: 'Payment record created successfully.',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (req.user.role === 'WEAVER') {
      query.weaverId = req.user._id;
    } else if (req.user.role === 'JACQUARD_WORKER') {
      query.workerId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('weaverId', 'name phone email businessName')
        .populate('workerId', 'name phone email')
        .populate('jobId', 'jobId status totalAgreedAmount scheduledDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
