import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJobStatusHistory extends Document {
  jobId?: Types.ObjectId;
  requestId: Types.ObjectId;
  previousStatus: string;
  newStatus: string;
  changedBy: Types.ObjectId;
  timestamp: Date;
  note?: string;
}

const JobStatusHistorySchema = new Schema<IJobStatusHistory>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', required: true, index: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  },
  {
    timestamps: true
  }
);

export const JobStatusHistory = mongoose.model<IJobStatusHistory>(
  'JobStatusHistory',
  JobStatusHistorySchema
);
