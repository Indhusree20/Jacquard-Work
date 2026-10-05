import mongoose, { Document, Schema, Types } from 'mongoose';

export type JobLifecycleStatus =
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IJob extends Document {
  jobId: string;
  requestId: Types.ObjectId;
  quoteId: Types.ObjectId;
  weaverId: Types.ObjectId;
  workerId: Types.ObjectId;
  workTypeId: Types.ObjectId;
  status: JobLifecycleStatus;
  scheduledDate: Date;
  startTime?: string; // e.g. "09:00 AM"
  endTime?: string;
  actualStartTime?: Date;
  actualCompletionTime?: Date;
  completionNotes?: string;
  rating?: number;
  feedback?: string;
  totalAgreedAmount: number;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true, uppercase: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', required: true, index: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', required: true },
    weaverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workTypeId: { type: Schema.Types.ObjectId, ref: 'WorkType', required: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true
    },
    scheduledDate: { type: Date, required: true },
    startTime: { type: String, default: '09:00 AM' },
    endTime: { type: String, default: '05:00 PM' },
    actualStartTime: { type: Date },
    actualCompletionTime: { type: Date },
    completionNotes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    totalAgreedAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_PAID', 'PAID'],
      default: 'PENDING',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);
