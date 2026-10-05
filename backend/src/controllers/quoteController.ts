import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Quote } from '../models/Quote';
import { WorkRequest } from '../models/WorkRequest';
import { Job } from '../models/Job';
import { JobStatusHistory } from '../models/JobStatusHistory';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';
import { SocketService } from '../services/SocketService';

const createQuoteSchema = z.object({
  requestId: z.string().min(1),
  baseCharge: z.number().min(0),
  additionalCharge: z.number().min(0).default(0),
  travelCharge: z.number().min(0).default(0),
  estimatedDays: z.number().min(1).default(1),
  notes: z.string().optional()
});

const generateQuoteId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Quote.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `QUO-${currentYear}-${sequence}`;
};

const generateJobId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Job.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `JOB-${currentYear}-${sequence}`;
};

export const submitQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'JACQUARD_WORKER') {
      res.status(403).json({ success: false, message: 'Only Jacquard Workers can submit quotations.' });
      return;
    }

    const { requestId, baseCharge, additionalCharge, travelCharge, estimatedDays, notes } =
      createQuoteSchema.parse(req.body);

    const workRequest = await WorkRequest.findById(requestId);
    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    if (workRequest.status !== 'REQUESTED' && workRequest.status !== 'UNDER_REVIEW' && workRequest.status !== 'QUOTED') {
      res.status(400).json({
        success: false,
        message: `Cannot submit quote. Work request is currently ${workRequest.status}.`
      });
      return;
    }

    // Check if worker already submitted a pending quote for this request
    const existingQuote = await Quote.findOne({
      requestId: workRequest._id,
      workerId: req.user._id,
      status: { $in: ['DRAFT', 'SENT'] }
    });

    const totalAmount = baseCharge + additionalCharge + travelCharge;

    let quote;
    if (existingQuote) {
      existingQuote.baseCharge = baseCharge;
      existingQuote.additionalCharge = additionalCharge;
      existingQuote.travelCharge = travelCharge;
      existingQuote.totalAmount = totalAmount;
      existingQuote.estimatedDays = estimatedDays;
      existingQuote.notes = notes;
      existingQuote.status = 'SENT';
      await existingQuote.save();
      quote = existingQuote;
    } else {
      const quoteId = await generateQuoteId();
      quote = await Quote.create({
        quoteId,
        requestId: workRequest._id,
        workerId: req.user._id,
        baseCharge,
        additionalCharge,
        travelCharge,
        totalAmount,
        estimatedDays,
        notes,
        status: 'SENT'
      });
    }

    // Update request status to QUOTED if still REQUESTED/UNDER_REVIEW
    if (workRequest.status === 'REQUESTED' || workRequest.status === 'UNDER_REVIEW') {
      const prevStatus = workRequest.status;
      workRequest.status = 'QUOTED';
      workRequest.quotedAmount = totalAmount;
      await workRequest.save();

      await JobStatusHistory.create({
        requestId: workRequest._id,
        previousStatus: prevStatus,
        newStatus: 'QUOTED',
        changedBy: req.user._id,
        note: `Quotation ${quote.quoteId} submitted by Jacquard master ${req.user.name}`
      });
    }

    await recordAuditLog(req, 'SUBMIT_QUOTE', 'Quote', quote._id.toString(), {
      quoteId: quote.quoteId,
      requestId: workRequest.requestId,
      totalAmount
    });

    // Notify Weaver via Socket and In-App notification
    SocketService.emitToUser(workRequest.weaverId.toString(), 'QUOTE_RECEIVED', {
      quoteId: quote.quoteId,
      requestId: workRequest.requestId,
      workerName: req.user.name,
      totalAmount
    });

    await Notification.create({
      userId: workRequest.weaverId,
      title: {
        en: `New Quotation Received: ${quote.quoteId}`,
        ta: `புதிய விலைப்பட்டியல் பெறப்பட்டது: ${quote.quoteId}`
      },
      message: {
        en: `${req.user.name} has submitted a quotation of ₹${totalAmount} for request ${workRequest.requestId}.`,
        ta: `${req.user.name} கோரிக்கை ${workRequest.requestId}-க்கு ₹${totalAmount} விலைப்பட்டியல் சமர்ப்பித்துள்ளார்.`
      },
      type: 'QUOTE_CREATED',
      link: `/weaver/requests/${workRequest._id}`,
      metadata: { quoteId: quote._id, requestId: workRequest._id }
    });

    res.status(201).json({
      success: true,
      message: 'Quotation submitted successfully to weaver.',
      data: { quote }
    });
  } catch (error) {
    next(error);
  }
};

export const respondToQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'WEAVER') {
      res.status(403).json({ success: false, message: 'Only weavers can accept or reject quotations.' });
      return;
    }

    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'ACCEPT' | 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be ACCEPT or REJECT.' });
      return;
    }

    const quote = await Quote.findById(id).populate('workerId', 'name email phone');
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found.' });
      return;
    }

    const workRequest = await WorkRequest.findById(quote.requestId);
    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Associated work request not found.' });
      return;
    }

    if (workRequest.weaverId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized. You do not own this work request.' });
      return;
    }

    if (action === 'REJECT') {
      quote.status = 'REJECTED';
      quote.rejectionReason = rejectionReason || 'Declined by weaver';
      await quote.save();

      await recordAuditLog(req, 'REJECT_QUOTE', 'Quote', quote._id.toString(), {
        quoteId: quote.quoteId,
        rejectionReason
      });

      // Notify Worker
      SocketService.emitToUser(quote.workerId._id.toString(), 'QUOTE_REJECTED', {
        quoteId: quote.quoteId,
        requestId: workRequest.requestId,
        reason: rejectionReason
      });

      await Notification.create({
        userId: quote.workerId._id,
        title: {
          en: `Quotation Declined: ${quote.quoteId}`,
          ta: `விலைப்பட்டியல் நிராகரிக்கப்பட்டது: ${quote.quoteId}`
        },
        message: {
          en: `Weaver declined quotation for request ${workRequest.requestId}.`,
          ta: `நெசவாளர் கோரிக்கை ${workRequest.requestId}-க்கான விலைப்பட்டியலை நிராகரித்துள்ளார்.`
        },
        type: 'QUOTE_REJECTED',
        link: `/worker/jobs`
      });

      res.status(200).json({
        success: true,
        message: 'Quotation rejected.',
        data: { quote }
      });
      return;
    }

    // ACTION: ACCEPT
    // Prevent race conditions: check if work request is already confirmed
    if (workRequest.status === 'CONFIRMED' || workRequest.assignedWorkerId) {
      res.status(400).json({
        success: false,
        message: 'This work request has already been confirmed with a worker.'
      });
      return;
    }

    quote.status = 'ACCEPTED';
    await quote.save();

    // Reject other pending quotes for this request
    await Quote.updateMany(
      { requestId: workRequest._id, _id: { $ne: quote._id }, status: 'SENT' },
      { status: 'REJECTED', rejectionReason: 'Another quote was accepted by weaver' }
    );

    const prevRequestStatus = workRequest.status;
    workRequest.status = 'CONFIRMED';
    workRequest.assignedWorkerId = quote.workerId._id as any;
    workRequest.finalAmount = quote.totalAmount;
    await workRequest.save();

    // Create formal Job record
    const jobId = await generateJobId();
    const job = await Job.create({
      jobId,
      requestId: workRequest._id,
      quoteId: quote._id,
      weaverId: workRequest.weaverId,
      workerId: quote.workerId._id,
      workTypeId: workRequest.workTypeId,
      status: 'CONFIRMED',
      scheduledDate: workRequest.requiredDate,
      totalAgreedAmount: quote.totalAmount,
      paymentStatus: 'PENDING'
    });

    // Record Status History
    await JobStatusHistory.create({
      jobId: job._id,
      requestId: workRequest._id,
      previousStatus: prevRequestStatus,
      newStatus: 'CONFIRMED',
      changedBy: req.user._id,
      note: `Quote ${quote.quoteId} accepted by weaver. Job ${job.jobId} created.`
    });

    await recordAuditLog(req, 'ACCEPT_QUOTE', 'Quote', quote._id.toString(), {
      quoteId: quote.quoteId,
      jobId: job.jobId,
      finalAmount: quote.totalAmount
    });

    // Notify Worker
    SocketService.emitToUser(quote.workerId._id.toString(), 'QUOTE_ACCEPTED', {
      quoteId: quote.quoteId,
      jobId: job.jobId,
      requestId: workRequest.requestId,
      weaverName: req.user.name,
      amount: quote.totalAmount
    });

    await Notification.create({
      userId: quote.workerId._id,
      title: {
        en: `🎉 Quotation Accepted! Job Assigned: ${job.jobId}`,
        ta: `🎉 விலைப்பட்டியல் ஏற்கப்பட்டது! பணி ஒதுக்கப்பட்டது: ${job.jobId}`
      },
      message: {
        en: `${req.user.name} accepted your quote of ₹${quote.totalAmount}. Please schedule and initiate work.`,
        ta: `${req.user.name} உங்கள் ₹${quote.totalAmount} விலைப்பட்டியலை ஏற்றுக்கொண்டார்.`
      },
      type: 'QUOTE_ACCEPTED',
      link: `/worker/jobs/${job._id}`,
      metadata: { jobId: job._id, requestId: workRequest._id }
    });

    res.status(200).json({
      success: true,
      message: 'Quotation accepted! Job has been confirmed and assigned to Jacquard worker.',
      data: {
        quote,
        job,
        workRequest
      }
    });
  } catch (error) {
    next(error);
  }
};
