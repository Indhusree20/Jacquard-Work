import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { WorkRequest, IDesignFile } from '../models/WorkRequest';
import { WorkType } from '../models/WorkType';
import { Service } from '../models/Service';
import { PricingService } from '../services/pricing/pricing.service';
import { PaymentStatusHistory } from '../models/PaymentStatusHistory';
import { Quote } from '../models/Quote';
import { Job } from '../models/Job';
import { JobStatusHistory } from '../models/JobStatusHistory';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';
import { SocketService } from '../services/SocketService';
import { StorageService } from '../services/StorageService';
import { EmailService } from '../services/EmailService';
import { ENV } from '../config/env';

const requestItemSchema = z.object({
  serviceId: z.string().min(1),
  optionKey: z.string().min(1),
  inputValue: z.preprocess((val) => Number(val), z.number().min(0).default(1))
});

const createWorkRequestSchema = z.object({
  serviceId: z.string().optional(),
  workTypeId: z.string().optional(),
  selectedOptions: z.record(z.any()).default({}),
  items: z.array(requestItemSchema).optional(),
  quantity: z.preprocess((val) => Number(val), z.number().min(1).default(1)),
  description: z.preprocess((val) => (val === undefined || val === null ? '' : String(val)), z.string()).optional().default(''),
  additionalRequirements: z.string().optional(),
  requiredDate: z.string().optional(),
  preferredDate1: z.string().optional(),
  preferredDate2: z.string().optional(),
  preferredTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE']).default('FLEXIBLE'),
  location: z.object({
    address: z.string().min(3),
    landmark: z.string().optional(),
    city: z.string().min(2),
    district: z.string().min(2),
    pincode: z.string().min(6),
    state: z.string().default('Tamil Nadu'),
    lat: z.preprocess((val) => Number(val), z.number()),
    lng: z.preprocess((val) => Number(val), z.number())
  })
});

const completeWorkRequestSchema = z.object({
  paymentStatus: z.enum(['PAID', 'UNPAID']),
  paymentMode: z.enum(['CASH', 'ONLINE', 'OTHER']).optional(),
  paidAmount: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).optional()),
  paymentDate: z.string().optional(),
  completionNotes: z.string().optional()
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PAID', 'UNPAID', 'PARTIALLY_PAID']),
  paymentMode: z.enum(['CASH', 'ONLINE', 'OTHER']).optional(),
  paidAmount: z.preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(0).optional()),
  notes: z.string().optional()
});

const generateRequestId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await WorkRequest.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `JWR-${currentYear}-${sequence}`;
};

export const createWorkRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'WEAVER') {
      res.status(403).json({ success: false, message: 'Only weavers can create work requests.' });
      return;
    }

    let parsedBody = req.body;
    if (typeof req.body.location === 'string') {
      try {
        parsedBody.location = JSON.parse(req.body.location);
      } catch (e) {
        // keep as is
      }
    }
    if (typeof req.body.selectedOptions === 'string') {
      try {
        parsedBody.selectedOptions = JSON.parse(req.body.selectedOptions);
      } catch (e) {
        // keep as is
      }
    }
    if (typeof req.body.items === 'string') {
      try {
        parsedBody.items = JSON.parse(req.body.items);
      } catch (e) {
        // keep as is
      }
    }

    const validated = createWorkRequestSchema.parse(parsedBody);

    let calculatedAmount = 0;
    let pricingSnapshot: any = undefined;
    let calculatedItems: any[] = [];
    let serviceRef: any = undefined;
    let workTypeRef: any = undefined;

    // 1. If items array is provided (Prompt 2.3 multi-service dynamic bill)
    if (validated.items && validated.items.length > 0) {
      const multiCalc = await PricingService.generateMultiItemSnapshot(validated.items);
      pricingSnapshot = multiCalc.snapshot;
      calculatedItems = multiCalc.items;
      calculatedAmount = multiCalc.totalAmount;
      if (calculatedItems.length > 0) {
        serviceRef = calculatedItems[0].serviceId;
      }
    } else if (validated.serviceId) {
      // Single service pricing
      const service = await Service.findById(validated.serviceId);
      if (!service) {
        res.status(404).json({ success: false, message: 'Selected service does not exist in catalogue.' });
        return;
      }
      serviceRef = service._id;

      pricingSnapshot = await PricingService.generateSnapshot(
        validated.serviceId,
        validated.selectedOptions,
        validated.quantity
      );

      calculatedAmount = pricingSnapshot.totalAmount;
      
      // If modern option is selected, store as item
      if (validated.selectedOptions?.optionKey) {
        const itemResult = await PricingService.calculateItems([
          {
            serviceId: validated.serviceId,
            optionKey: validated.selectedOptions.optionKey,
            inputValue: validated.selectedOptions.inputValue !== undefined ? Number(validated.selectedOptions.inputValue) : validated.quantity
          }
        ]);
        calculatedItems = itemResult.items;
      }
    } else if (validated.workTypeId) {
      // Legacy WorkType fallback
      const workType = await WorkType.findById(validated.workTypeId);
      if (!workType) {
        res.status(404).json({ success: false, message: 'Selected work type does not exist.' });
        return;
      }
      workTypeRef = workType._id;
      calculatedAmount = workType.basePrice * validated.quantity;
      pricingSnapshot = {
        serviceNameSnapshot: workType.name,
        selectedOptionsSnapshot: validated.selectedOptions || {},
        pricingVersion: 1,
        baseAmount: calculatedAmount,
        additionalAmount: 0,
        totalAmount: calculatedAmount,
        currency: 'INR',
        breakdown: [
          {
            label: {
              en: `Base Charge (${workType.name.en})`,
              ta: `அடிப்படை கட்டணம் (${workType.name.ta})`
            },
            amount: calculatedAmount
          }
        ],
        calculatedAt: new Date()
      };
    } else {
      res.status(400).json({ success: false, message: 'Please select at least one Jacquard service for the work request.' });
      return;
    }

    // 2. Process uploaded design files if any
    const designFiles: IDesignFile[] = [];
    const files = req.files as Express.Multer.File[];
    const storageService = StorageService.getInstance();

    if (files && files.length > 0) {
      for (const file of files) {
        const stored = await storageService.uploadFile(file);
        designFiles.push({
          fileName: stored.fileName,
          fileUrl: stored.fileUrl,
          fileType: stored.fileType,
          fileSize: stored.fileSize,
          uploadedBy: req.user._id,
          uploadedAt: new Date()
        });
      }
    }

    const requestId = await generateRequestId();
    const primaryDateStr = validated.preferredDate1 || validated.requiredDate || new Date().toISOString();
    const primaryDate = new Date(primaryDateStr);

    const workRequest = await WorkRequest.create({
      requestId,
      weaverId: req.user._id,
      workTypeId: workTypeRef,
      serviceId: serviceRef,
      selectedOptions: validated.selectedOptions,
      pricingSnapshot,
      items: calculatedItems,
      designFiles,
      quantity: validated.quantity,
      description: validated.description,
      additionalRequirements: validated.additionalRequirements,
      requiredDate: primaryDate,
      preferredDate1: validated.preferredDate1 || (validated.requiredDate ? new Date(validated.requiredDate).toISOString().split('T')[0] : undefined),
      preferredDate2: validated.preferredDate2 || undefined,
      preferredTime: validated.preferredTime,
      location: validated.location,
      status: 'REQUESTED',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      estimatedAmount: calculatedAmount,
      finalAmount: calculatedAmount
    });

    // Record initial status history
    await JobStatusHistory.create({
      requestId: workRequest._id,
      previousStatus: 'NONE',
      newStatus: 'REQUESTED',
      changedBy: req.user._id,
      note: 'Work request submitted with fixed admin-configured price snapshot.'
    });

    await recordAuditLog(req, 'CREATE_WORK_REQUEST', 'WorkRequest', workRequest._id.toString(), {
      requestId,
      totalAmount: calculatedAmount,
      pricingVersion: pricingSnapshot?.pricingVersion,
      itemsCount: calculatedItems.length
    });

    // 1. In-app notifications & socket events for eligible Jacquard Masters in the district
    try {
      const eligibleMasters = await User.find({
        role: 'JACQUARD_WORKER',
        status: 'ACTIVE',
        $or: [
          { 'location.district': workRequest.location.district },
          { 'location.district': { $exists: false } },
          { 'location.district': '' }
        ]
      }).select('_id');

      const masterNotifications = eligibleMasters.map((master) => ({
        userId: master._id,
        title: {
          en: 'New Jacquard Work Request',
          ta: 'புதிய ஜாக்கார்ட் பணி கோரிக்கை'
        },
        message: {
          en: `New work request ${workRequest.requestId} submitted for ${workRequest.location.district}. Base amount ₹${calculatedAmount}.`,
          ta: `${workRequest.location.district} மாவட்டத்திற்கு புதிய பணி கோரிக்கை ${workRequest.requestId} வந்துள்ளது. அடிப்படை தொகை ₹${calculatedAmount}.`
        },
        type: 'WORK_REQUEST_SUBMITTED' as const,
        read: false,
        link: `/worker/requests/${workRequest._id}`,
        metadata: { requestId: workRequest.requestId, district: workRequest.location.district }
      }));

      // In-app notifications for Admins
      const adminUsers = await User.find({
        role: { $in: ['ADMIN', 'PRIMARY_ADMIN'] },
        status: 'ACTIVE'
      }).select('_id');

      const adminNotifications = adminUsers.map((admin) => ({
        userId: admin._id,
        title: {
          en: 'New Work Request Received',
          ta: 'புதிய வேலை கோரிக்கை பெறப்பட்டது'
        },
        message: {
          en: `${workRequest.requestId} has been submitted by a Weaver and is awaiting Master review.`,
          ta: `நெசவாளர் புதிய பணி கோரிக்கை ${workRequest.requestId} சமர்ப்பித்துள்ளார். ஆசாரி ஆய்வில் உள்ளது.`
        },
        type: 'WORK_REQUEST_SUBMITTED' as const,
        read: false,
        link: `/admin/jobs-quotes`,
        metadata: { requestId: workRequest.requestId, district: workRequest.location.district }
      }));

      if (masterNotifications.length > 0 || adminNotifications.length > 0) {
        await Notification.insertMany([...masterNotifications, ...adminNotifications]);
      }
    } catch (notifErr) {
      console.error('Non-blocking error creating work request notifications:', notifErr);
    }

    // Broadcast realtime event to Jacquard workers and Admins
    SocketService.emitToRole('JACQUARD_WORKER', 'NEW_WORK_REQUEST', {
      requestId: workRequest.requestId,
      district: workRequest.location.district,
      quantity: workRequest.quantity,
      totalAmount: calculatedAmount
    });
    SocketService.emitToRole('ADMIN', 'NEW_WORK_REQUEST', {
      requestId: workRequest.requestId,
      district: workRequest.location.district,
      quantity: workRequest.quantity,
      totalAmount: calculatedAmount
    });
    SocketService.emitToRole('PRIMARY_ADMIN', 'NEW_WORK_REQUEST', {
      requestId: workRequest.requestId,
      district: workRequest.location.district,
      quantity: workRequest.quantity,
      totalAmount: calculatedAmount
    });

    res.status(201).json({
      success: true,
      message: 'Work request created successfully with dynamic input-calculated price.',
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};


export const getWorkRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { status, district, serviceId, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (req.user.role === 'WEAVER') {
      query.weaverId = req.user._id;
    } else if (req.user.role === 'JACQUARD_WORKER') {
      if (req.query.scope === 'assigned') {
        query.assignedWorkerId = req.user._id;
      } else if (req.query.scope === 'available') {
        query.status = { $in: ['REQUESTED', 'UNDER_REVIEW', 'QUOTED'] };
      }
    }

    if (status) query.status = status;
    if (district) query['location.district'] = district;
    if (serviceId) query.serviceId = serviceId;

    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      WorkRequest.find(query)
        .populate('weaverId', 'name email phone businessName location avatar')
        .populate('assignedWorkerId', 'name email phone experienceYears avatar')
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
        requests,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkRequestById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const workRequest = await WorkRequest.findById(id)
      .populate('weaverId', 'name email phone businessName location avatar')
      .populate('assignedWorkerId', 'name email phone experienceYears avatar specialization')
      .populate('serviceId')
      .populate('workTypeId');

    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    if (
      req.user?.role === 'WEAVER' &&
      workRequest.weaverId._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Unauthorized access to this work request.' });
      return;
    }

    let quotes: any[] = [];
    if (req.user?.role === 'WEAVER' || req.user?.role === 'ADMIN' || req.user?.role === 'PRIMARY_ADMIN') {
      quotes = await Quote.find({ requestId: workRequest._id })
        .populate('workerId', 'name email phone experienceYears specialization avatar')
        .sort({ createdAt: -1 });
    } else if (req.user?.role === 'JACQUARD_WORKER') {
      quotes = await Quote.find({ requestId: workRequest._id, workerId: req.user._id })
        .populate('workerId', 'name email phone experienceYears specialization avatar')
        .sort({ createdAt: -1 });
    }

    const history = await JobStatusHistory.find({ requestId: workRequest._id })
      .populate('changedBy', 'name role')
      .sort({ timestamp: 1 });

    const job = await Job.findOne({ requestId: workRequest._id })
      .populate('workerId', 'name email phone')
      .populate('weaverId', 'name email phone');

    res.status(200).json({
      success: true,
      data: {
        workRequest,
        quotes,
        history,
        job
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelWorkRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const workRequest = await WorkRequest.findById(id);
    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    if (
      req.user?.role === 'WEAVER' &&
      workRequest.weaverId.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Only the requesting weaver can cancel.' });
      return;
    }

    if (workRequest.status === 'IN_PROGRESS' || workRequest.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel a request that is already in progress or completed.'
      });
      return;
    }

    const previousStatus = workRequest.status;
    workRequest.status = 'CANCELLED';
    workRequest.cancellationReason = reason || 'Cancelled by user';
    await workRequest.save();

    await JobStatusHistory.create({
      requestId: workRequest._id,
      previousStatus,
      newStatus: 'CANCELLED',
      changedBy: req.user!._id,
      note: reason || 'Cancelled by user'
    });

    await recordAuditLog(req, 'CANCEL_WORK_REQUEST', 'WorkRequest', id, { reason });

    res.status(200).json({
      success: true,
      message: 'Work request cancelled.',
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};

export const completeWorkRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const validated = completeWorkRequestSchema.parse(req.body);

    const workRequest = await WorkRequest.findById(id)
      .populate('weaverId', 'name email phone')
      .populate('assignedWorkerId', 'name email phone');

    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    // Role check: Worker assigned, or Admin
    const isWorker = req.user.role === 'JACQUARD_WORKER';
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'PRIMARY_ADMIN';

    if (isWorker && workRequest.assignedWorkerId && workRequest.assignedWorkerId._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not assigned to this work request.' });
      return;
    }

    if (!isWorker && !isAdmin) {
      res.status(403).json({ success: false, message: 'Only assigned Jacquard workers or admins can submit completion reports.' });
      return;
    }

    const previousStatus = workRequest.status;
    const previousPaymentStatus = workRequest.paymentStatus || 'UNPAID';

    workRequest.status = 'COMPLETED';
    workRequest.completedAt = new Date();
    workRequest.paymentStatus = validated.paymentStatus;
    if (validated.completionNotes) {
      workRequest.completionNotes = validated.completionNotes;
    }

    if (validated.paymentStatus === 'PAID') {
      workRequest.paymentMode = validated.paymentMode || 'CASH';
      workRequest.paidAmount = validated.paidAmount !== undefined
        ? validated.paidAmount
        : (workRequest.finalAmount || workRequest.estimatedAmount || 0);
      workRequest.paidAt = validated.paymentDate ? new Date(validated.paymentDate) : new Date();
    } else {
      workRequest.paymentMode = undefined;
      workRequest.paidAmount = 0;
      workRequest.paidAt = undefined;
    }

    await workRequest.save();

    // Log in JobStatusHistory
    await JobStatusHistory.create({
      requestId: workRequest._id,
      previousStatus,
      newStatus: 'COMPLETED',
      changedBy: req.user._id,
      note: `Work completed. Payment status reported as ${validated.paymentStatus}. ${validated.completionNotes || ''}`
    });

    // Log in PaymentStatusHistory
    await PaymentStatusHistory.create({
      requestId: workRequest._id,
      workerId: isWorker ? req.user._id : workRequest.assignedWorkerId?._id,
      previousStatus: previousPaymentStatus,
      newStatus: validated.paymentStatus,
      paymentMode: validated.paymentStatus === 'PAID' ? workRequest.paymentMode : undefined,
      amount: validated.paymentStatus === 'PAID' ? workRequest.paidAmount : workRequest.finalAmount || 0,
      notes: validated.completionNotes || `Work marked as completed with payment status ${validated.paymentStatus}`,
      recordedBy: req.user._id
    });

    // Synchronize associated Job if exists
    const job = await Job.findOne({ requestId: workRequest._id });
    if (job) {
      job.status = 'COMPLETED';
      job.actualCompletionTime = new Date();
      if (validated.completionNotes) {
        job.completionNotes = validated.completionNotes;
      }
      await job.save();
    }

    await recordAuditLog(req, 'COMPLETE_WORK_REQUEST', 'WorkRequest', id, {
      requestId: workRequest.requestId,
      paymentStatus: validated.paymentStatus,
      paymentMode: workRequest.paymentMode,
      paidAmount: workRequest.paidAmount
    });

    // Real-time broadcast
    if (workRequest.weaverId) {
      SocketService.emitToUser(workRequest.weaverId._id.toString(), 'WORK_REQUEST_COMPLETED', {
        requestId: workRequest.requestId,
        paymentStatus: validated.paymentStatus,
        completedBy: req.user.name
      });
    }

    res.status(200).json({
      success: true,
      message: `Work completed successfully. Payment recorded as ${validated.paymentStatus}.`,
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const validated = updatePaymentStatusSchema.parse(req.body);

    const workRequest = await WorkRequest.findById(id);
    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    const previousStatus = workRequest.paymentStatus || 'UNPAID';
    workRequest.paymentStatus = validated.paymentStatus;

    if (validated.paymentStatus === 'PAID') {
      workRequest.paymentMode = validated.paymentMode || 'CASH';
      workRequest.paidAmount = validated.paidAmount !== undefined
        ? validated.paidAmount
        : (workRequest.finalAmount || workRequest.estimatedAmount || 0);
      workRequest.paidAt = new Date();
    } else if (validated.paymentStatus === 'PARTIALLY_PAID') {
      workRequest.paymentMode = validated.paymentMode || 'CASH';
      workRequest.paidAmount = validated.paidAmount || 0;
    } else {
      workRequest.paymentMode = undefined;
      workRequest.paidAmount = 0;
      workRequest.paidAt = undefined;
    }

    await workRequest.save();

    await PaymentStatusHistory.create({
      requestId: workRequest._id,
      workerId: workRequest.assignedWorkerId,
      previousStatus,
      newStatus: validated.paymentStatus,
      paymentMode: validated.paymentMode,
      amount: validated.paidAmount || workRequest.paidAmount || workRequest.finalAmount || 0,
      notes: validated.notes || `Payment status manually updated to ${validated.paymentStatus}`,
      recordedBy: req.user._id
    });

    await recordAuditLog(req, 'UPDATE_PAYMENT_STATUS', 'WorkRequest', id, {
      requestId: workRequest.requestId,
      previousStatus,
      newStatus: validated.paymentStatus
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${validated.paymentStatus}.`,
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};

const masterFinalChargesSchema = z.object({
  selectedDate: z.string().min(1, 'Please select one of the preferred work dates'),
  petrolAllowance: z.preprocess((val) => Number(val !== undefined && val !== '' ? val : 0), z.number().min(0).default(0)),
  viluthuCharge: z.preprocess((val) => Number(val !== undefined && val !== '' ? val : 0), z.number().min(0).default(0)),
  notes: z.string().optional(),
  confirmationBufferDays: z.preprocess((val) => Number(val !== undefined && val !== '' ? val : 1), z.number().min(1).default(1))
});

/**
 * Prompt 2.6: Master Accepts Request, Selects ONE Preferred Date, and Sets Petrol & Viluthu Charges
 */
export const masterAcceptAndSetFinalCharges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'JACQUARD_WORKER') {
      res.status(403).json({ success: false, message: 'Only Jacquard Masters can submit final charges.' });
      return;
    }

    const { id } = req.params;
    const validated = masterFinalChargesSchema.parse(req.body);

    const workRequest = await WorkRequest.findById(id).populate('weaverId', 'name email phone preferredLanguage');
    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    const allowedStatuses = ['REQUESTED', 'UNDER_REVIEW', 'QUOTED', 'MASTER_ACCEPTED', 'FINAL_CHARGES_PENDING_USER'];
    if (!allowedStatuses.includes(workRequest.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot submit final charges for request currently in ${workRequest.status} status.`
      });
      return;
    }

    // Validate that selectedDate matches one of the user's preferred dates
    const date1 = workRequest.preferredDate1
      ? new Date(workRequest.preferredDate1).toISOString().split('T')[0]
      : (workRequest.requiredDate ? new Date(workRequest.requiredDate).toISOString().split('T')[0] : null);
    const date2 = workRequest.preferredDate2
      ? new Date(workRequest.preferredDate2).toISOString().split('T')[0]
      : null;

    const normalizedSelected = new Date(validated.selectedDate).toISOString().split('T')[0];

    const validOptions = [date1, date2].filter(Boolean);
    if (!validOptions.includes(normalizedSelected)) {
      res.status(400).json({
        success: false,
        message: `Selected date (${normalizedSelected}) must be one of the Weaver's preferred dates: ${validOptions.join(' or ')}.`
      });
      return;
    }

    // Authoritative backend calculation
    const baseServiceAmount = workRequest.estimatedAmount || workRequest.pricingSnapshot?.totalAmount || 0;
    const petrolAllowance = Math.max(0, validated.petrolAllowance);
    const viluthuCharge = Math.max(0, validated.viluthuCharge);
    const calculatedFinalAmount = Math.round((baseServiceAmount + petrolAllowance + viluthuCharge) * 100) / 100;

    // Compute approval deadline
    const selectedDateObj = new Date(validated.selectedDate);
    const bufferMs = validated.confirmationBufferDays * 24 * 60 * 60 * 1000;
    let approvalDeadline = new Date(selectedDateObj.getTime() - bufferMs);

    // If deadline is already in the past, provide at least a 12 hour window or end of today
    if (approvalDeadline.getTime() <= Date.now()) {
      approvalDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
    }

    const prevVersion = workRequest.finalChargeSnapshot?.version || 0;
    const newVersion = prevVersion + 1;

    const previousStatus = workRequest.status;
    workRequest.assignedWorkerId = req.user._id;
    workRequest.selectedWorkDate = normalizedSelected;
    workRequest.requiredDate = selectedDateObj;
    workRequest.approvalDeadline = approvalDeadline;
    workRequest.finalAmount = calculatedFinalAmount;
    workRequest.status = 'FINAL_CHARGES_PENDING_USER';

    workRequest.finalChargeSnapshot = {
      baseServiceAmount,
      petrolAllowance,
      viluthuCharge,
      finalAmount: calculatedFinalAmount,
      selectedDate: normalizedSelected,
      submittedBy: req.user._id,
      submittedAt: new Date(),
      version: newVersion,
      approvalDeadline,
      notes: validated.notes
    };

    await workRequest.save();

    // Log status history
    await JobStatusHistory.create({
      requestId: workRequest._id,
      previousStatus,
      newStatus: 'FINAL_CHARGES_PENDING_USER',
      changedBy: req.user._id,
      note: `Master configured Petrol (₹${petrolAllowance}) + Viluthu (₹${viluthuCharge}) -> Final Amount: ₹${calculatedFinalAmount} for date ${normalizedSelected} (v${newVersion})`
    });

    // Send notification and email to Weaver
    const weaver = workRequest.weaverId as any;
    if (weaver && weaver.email) {
      const emailService = EmailService.getInstance();
      const clientBaseUrl = ENV.CLIENT_URL || 'http://localhost:3000';
      const confirmationUrl = `${clientBaseUrl}/weaver/requests/${workRequest._id}/confirm-final`;
      const serviceName = workRequest.pricingSnapshot?.serviceNameSnapshot?.en || 'Jacquard Loom Work';

      await emailService.sendFinalChargesForApproval({
        toEmail: weaver.email,
        userName: weaver.name || 'Weaver',
        requestId: workRequest.requestId,
        serviceName,
        selectedDate: normalizedSelected,
        baseAmount: baseServiceAmount,
        petrolAllowance,
        viluthuCharge,
        finalAmount: calculatedFinalAmount,
        approvalDeadline,
        confirmationUrl
      });
    }

    // In-app notification
    await Notification.create({
      userId: workRequest.weaverId,
      title: {
        en: `Master Sent Final Charges for Request ${workRequest.requestId}`,
        ta: `பணி கோரிக்கை ${workRequest.requestId} - ஆசாரி இறுதி கட்டணத்தை அனுப்பியுள்ளார்`
      },
      message: {
        en: `Selected Date: ${normalizedSelected} • Final Amount: ₹${calculatedFinalAmount} (Petrol: ₹${petrolAllowance}, Viluthu: ₹${viluthuCharge}). Please review and approve.`,
        ta: `தேர்வு செய்யப்பட்ட தேதி: ${normalizedSelected} • இறுதி தொகை: ₹${calculatedFinalAmount}. தயவுசெய்து சரிபார்த்து உறுதிப்படுத்தவும்.`
      },
      type: 'WORK_REQUEST',
      referenceId: workRequest._id
    });

    await recordAuditLog(req, 'MASTER_SET_FINAL_CHARGES', 'WorkRequest', id, {
      requestId: workRequest.requestId,
      selectedDate: normalizedSelected,
      baseServiceAmount,
      petrolAllowance,
      viluthuCharge,
      finalAmount: calculatedFinalAmount,
      version: newVersion
    });

    res.status(200).json({
      success: true,
      message: 'Final charges and work date successfully submitted for Weaver approval.',
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Prompt 2.6: Weaver Reviews and Confirms Final Amount and Work Date
 */
export const userConfirmFinalCharges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'WEAVER') {
      res.status(403).json({ success: false, message: 'Only Weavers can approve final work charges.' });
      return;
    }

    const { id } = req.params;
    const workRequest = await WorkRequest.findById(id)
      .populate('weaverId', 'name email phone')
      .populate('assignedWorkerId', 'name email phone');

    if (!workRequest) {
      res.status(404).json({ success: false, message: 'Work request not found.' });
      return;
    }

    if (workRequest.weaverId._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to confirm this work request.' });
      return;
    }

    if (workRequest.status !== 'FINAL_CHARGES_PENDING_USER' && workRequest.status !== 'MASTER_ACCEPTED') {
      res.status(400).json({
        success: false,
        message: `Work request is currently in ${workRequest.status} status and cannot be confirmed.`
      });
      return;
    }

    if (!workRequest.finalChargeSnapshot) {
      res.status(400).json({
        success: false,
        message: 'Master has not yet submitted final charges for this request.'
      });
      return;
    }

    // Check approval deadline
    const now = new Date();
    if (workRequest.finalChargeSnapshot.approvalDeadline && now > workRequest.finalChargeSnapshot.approvalDeadline) {
      // Expired! Release assignment
      const previousWorker = workRequest.assignedWorkerId;
      workRequest.status = 'USER_CONFIRMATION_EXPIRED';
      workRequest.assignedWorkerId = undefined;
      await workRequest.save();

      await JobStatusHistory.create({
        requestId: workRequest._id,
        previousStatus: 'FINAL_CHARGES_PENDING_USER',
        newStatus: 'USER_CONFIRMATION_EXPIRED',
        changedBy: req.user._id,
        note: `User confirmation window expired on ${workRequest.finalChargeSnapshot.approvalDeadline.toISOString()}. Request released for reassignment.`
      });

      // Notify previous master
      if (previousWorker && (previousWorker as any).email) {
        const emailService = EmailService.getInstance();
        await emailService.sendConfirmationExpiredNotice({
          toEmail: (previousWorker as any).email,
          recipientName: (previousWorker as any).name || 'Master',
          requestId: workRequest.requestId,
          scheduledDate: workRequest.finalChargeSnapshot.selectedDate,
          finalAmount: workRequest.finalChargeSnapshot.finalAmount
        });
      }

      res.status(400).json({
        success: false,
        message: 'The confirmation deadline for this request has expired. The request has been released for reassignment.',
        data: { workRequest }
      });
      return;
    }

    // Confirm charges and schedule
    const previousStatus = workRequest.status;
    workRequest.status = 'SCHEDULED';
    workRequest.finalAmount = workRequest.finalChargeSnapshot.finalAmount;
    workRequest.finalChargeSnapshot.userConfirmedAt = new Date();
    await workRequest.save();

    await JobStatusHistory.create({
      requestId: workRequest._id,
      previousStatus,
      newStatus: 'SCHEDULED',
      changedBy: req.user._id,
      note: `Weaver approved final amount ₹${workRequest.finalAmount}. Job scheduled for ${workRequest.finalChargeSnapshot.selectedDate}.`
    });

    // Send confirmation emails
    const weaver = workRequest.weaverId as any;
    const worker = workRequest.assignedWorkerId as any;
    const emailService = EmailService.getInstance();
    const serviceName = workRequest.pricingSnapshot?.serviceNameSnapshot?.en || 'Jacquard Loom Work';

    if (weaver && weaver.email) {
      await emailService.sendFinalConfirmationSuccess({
        toEmail: weaver.email,
        userName: weaver.name || 'Weaver',
        workerName: worker?.name || 'Assigned Master',
        requestId: workRequest.requestId,
        serviceName,
        scheduledDate: workRequest.finalChargeSnapshot.selectedDate,
        finalAmount: workRequest.finalAmount
      });
    }

    if (worker && worker.email) {
      await emailService.sendFinalConfirmationSuccess({
        toEmail: worker.email,
        userName: worker.name || 'Master',
        workerName: worker.name || 'Master',
        requestId: workRequest.requestId,
        serviceName,
        scheduledDate: workRequest.finalChargeSnapshot.selectedDate,
        finalAmount: workRequest.finalAmount
      });
    }

    // Notifications
    await Notification.create({
      userId: worker?._id || workRequest.assignedWorkerId,
      title: {
        en: `Weaver Approved Final Amount — Work Scheduled for ${workRequest.finalChargeSnapshot.selectedDate}`,
        ta: `நெசவாளர் இறுதி தொகையை உறுதிப்படுத்தியுள்ளார் — பணி அட்டவணை ${workRequest.finalChargeSnapshot.selectedDate}`
      },
      message: {
        en: `Work Request ${workRequest.requestId} is confirmed for ₹${workRequest.finalAmount}.`,
        ta: `பணி கோரிக்கை ${workRequest.requestId} ₹${workRequest.finalAmount} தொகைக்கு உறுதிப்படுத்தப்பட்டது.`
      },
      type: 'WORK_REQUEST',
      referenceId: workRequest._id
    });

    await recordAuditLog(req, 'USER_CONFIRMED_FINAL_CHARGES', 'WorkRequest', id, {
      requestId: workRequest.requestId,
      finalAmount: workRequest.finalAmount,
      selectedDate: workRequest.finalChargeSnapshot.selectedDate,
      version: workRequest.finalChargeSnapshot.version
    });

    res.status(200).json({
      success: true,
      message: 'Work request and final charges confirmed! The job is now scheduled.',
      data: { workRequest }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Background / Admin processor to expire overdue pending confirmations
 */
export const checkAndExpirePendingConfirmations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const expiredRequests = await WorkRequest.find({
      status: 'FINAL_CHARGES_PENDING_USER',
      approvalDeadline: { $lt: now }
    }).populate('assignedWorkerId', 'name email');

    let expiredCount = 0;
    const emailService = EmailService.getInstance();

    for (const reqDoc of expiredRequests) {
      const prevWorker = reqDoc.assignedWorkerId as any;
      reqDoc.status = 'USER_CONFIRMATION_EXPIRED';
      reqDoc.assignedWorkerId = undefined;
      await reqDoc.save();

      await JobStatusHistory.create({
        requestId: reqDoc._id,
        previousStatus: 'FINAL_CHARGES_PENDING_USER',
        newStatus: 'USER_CONFIRMATION_EXPIRED',
        changedBy: req.user?._id || reqDoc.weaverId,
        note: `Confirmation deadline expired. Released for reassignment.`
      });

      if (prevWorker && prevWorker.email) {
        await emailService.sendConfirmationExpiredNotice({
          toEmail: prevWorker.email,
          recipientName: prevWorker.name || 'Master',
          requestId: reqDoc.requestId,
          scheduledDate: reqDoc.finalChargeSnapshot?.selectedDate || 'Scheduled Date',
          finalAmount: reqDoc.finalAmount || 0
        });
      }
      expiredCount++;
    }

    res.status(200).json({
      success: true,
      message: `Processed ${expiredCount} expired work request confirmations.`,
      data: { expiredCount }
    });
  } catch (error) {
    next(error);
  }
};


