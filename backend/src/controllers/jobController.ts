import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Job, JobLifecycleStatus } from '../models/Job';
import { WorkRequest } from '../models/WorkRequest';
import { JobStatusHistory } from '../models/JobStatusHistory';
import { Notification } from '../models/Notification';
import { Payment } from '../models/Payment';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';
import { SocketService } from '../services/SocketService';
import { MapService } from '../services/MapService';

const updateJobStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  scheduledDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  completionNotes: z.string().optional(),
  note: z.string().optional()
});

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional()
});

export const getJobs = async (
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
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('weaverId', 'name email phone businessName location avatar')
        .populate('workerId', 'name email phone experienceYears specialization avatar')
        .populate('workTypeId')
        .populate('requestId')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobs,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('weaverId', 'name email phone businessName location avatar')
      .populate('workerId', 'name email phone experienceYears specialization avatar')
      .populate('workTypeId')
      .populate({
        path: 'requestId',
        populate: { path: 'designFiles' }
      })
      .populate('quoteId');

    if (!job) {
      res.status(404).json({ success: false, message: 'Job record not found.' });
      return;
    }

    // Role verification
    if (
      req.user?.role === 'WEAVER' &&
      job.weaverId._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Unauthorized access to this job.' });
      return;
    }

    if (
      req.user?.role === 'JACQUARD_WORKER' &&
      job.workerId._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Unauthorized access to this job.' });
      return;
    }

    // History and payments
    const [history, payments] = await Promise.all([
      JobStatusHistory.find({ $or: [{ jobId: job._id }, { requestId: job.requestId._id }] })
        .populate('changedBy', 'name role')
        .sort({ timestamp: 1 }),
      Payment.find({ jobId: job._id }).sort({ createdAt: -1 })
    ]);

    // Map Navigation helper for Jacquard Worker
    const workRequest = job.requestId as any;
    let navigationUrl = '';
    if (workRequest && workRequest.location) {
      const mapService = MapService.getInstance();
      navigationUrl = mapService.getNavigationUrl({
        lat: workRequest.location.lat,
        lng: workRequest.location.lng
      });
    }

    res.status(200).json({
      success: true,
      data: {
        job,
        history,
        payments,
        navigationUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (
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
    const validatedData = updateJobStatusSchema.parse(req.body);

    const job = await Job.findById(id).populate('weaverId', 'name email phone').populate('workerId', 'name email phone');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found.' });
      return;
    }

    // Only assigned worker or admin can update status
    if (
      req.user.role === 'JACQUARD_WORKER' &&
      job.workerId._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Only assigned Jacquard master can update this job status.' });
      return;
    }

    const previousStatus = job.status;
    const newStatus = validatedData.status as JobLifecycleStatus;

    job.status = newStatus;
    if (validatedData.scheduledDate) {
      job.scheduledDate = new Date(validatedData.scheduledDate);
    }
    if (validatedData.startTime) job.startTime = validatedData.startTime;
    if (validatedData.endTime) job.endTime = validatedData.endTime;
    if (newStatus === 'IN_PROGRESS' && !job.actualStartTime) {
      job.actualStartTime = new Date();
    }
    if (newStatus === 'COMPLETED') {
      job.actualCompletionTime = new Date();
      if (validatedData.completionNotes) {
        job.completionNotes = validatedData.completionNotes;
      }
    }

    await job.save();

    // Synchronize parent WorkRequest status
    await WorkRequest.findByIdAndUpdate(job.requestId, {
      status: newStatus
    });

    // Record Status History
    await JobStatusHistory.create({
      jobId: job._id,
      requestId: job.requestId,
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      note: validatedData.note || `Job status updated to ${newStatus} by ${req.user.name}`
    });

    await recordAuditLog(req, 'UPDATE_JOB_STATUS', 'Job', job._id.toString(), {
      jobId: job.jobId,
      previousStatus,
      newStatus
    });

    // Notify Weaver in real-time & DB
    const statusTitles: Record<string, { en: string; ta: string }> = {
      SCHEDULED: {
        en: `📅 Job Scheduled: ${job.jobId}`,
        ta: `📅 பணி திட்டமிடப்பட்டது: ${job.jobId}`
      },
      IN_PROGRESS: {
        en: `⚙️ Work Started at Loom: ${job.jobId}`,
        ta: `⚙️ தறியில் வேலை தொடங்கியது: ${job.jobId}`
      },
      COMPLETED: {
        en: `✅ Jacquard Work Completed: ${job.jobId}`,
        ta: `✅ ஜாகார்ட் பணி நிறைவடைந்தது: ${job.jobId}`
      },
      CANCELLED: {
        en: `⚠️ Job Cancelled: ${job.jobId}`,
        ta: `⚠️ பணி ரத்து செய்யப்பட்டது: ${job.jobId}`
      }
    };

    const statusMessages: Record<string, { en: string; ta: string }> = {
      SCHEDULED: {
        en: `Jacquard Master ${req.user.name} scheduled your job for ${new Date(job.scheduledDate).toLocaleDateString()}.`,
        ta: `ஜாகார்ட் மாஸ்டர் ${req.user.name} உங்கள் பணியை திட்டமிட்டுள்ளார்.`
      },
      IN_PROGRESS: {
        en: `Work is currently in progress at your loom site.`,
        ta: `உங்கள் தறி தளத்தில் தற்போது பணி நடைபெற்று வருகிறது.`
      },
      COMPLETED: {
        en: `Work has been successfully completed. Please review and verify.`,
        ta: `பணி வெற்றிகரமாக நிறைவடைந்தது. தயவுசெய்து சரிபார்க்கவும்.`
      },
      CANCELLED: {
        en: `Job has been cancelled.`,
        ta: `பணி ரத்து செய்யப்பட்டுள்ளது.`
      }
    };

    if (statusTitles[newStatus]) {
      SocketService.emitToUser(job.weaverId._id.toString(), 'JOB_STATUS_UPDATED', {
        jobId: job.jobId,
        status: newStatus,
        updatedBy: req.user.name
      });

      await Notification.create({
        userId: job.weaverId._id,
        title: statusTitles[newStatus],
        message: statusMessages[newStatus],
        type: newStatus === 'COMPLETED' ? 'WORK_COMPLETED' : 'WORK_STARTED',
        link: `/weaver/jobs/${job._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: `Job status updated to ${newStatus}.`,
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'WEAVER') {
      res.status(403).json({ success: false, message: 'Only weavers can provide feedback.' });
      return;
    }

    const { id } = req.params;
    const { rating, feedback } = feedbackSchema.parse(req.body);

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found.' });
      return;
    }

    if (job.weaverId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    job.rating = rating;
    job.feedback = feedback;
    await job.save();

    await recordAuditLog(req, 'SUBMIT_FEEDBACK', 'Job', job._id.toString(), { rating, feedback });

    res.status(200).json({
      success: true,
      message: 'Thank you for your rating and feedback!',
      data: { job }
    });
  } catch (error) {
    next(error);
  }
};
