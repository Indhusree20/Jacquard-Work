import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentStatusHistory extends Document {
  requestId: Types.ObjectId;
  workRequestId?: Types.ObjectId;
  jobId?: Types.ObjectId;
  workerId?: Types.ObjectId;
  previousStatus: string;
  newStatus: string;
  paymentMode?: 'CASH' | 'ONLINE' | 'OTHER' | string;
  paidAmount?: number;
  amount?: number;
  notes?: string;
  recordedBy?: Types.ObjectId;
  reportedBy?: {
    userId: Types.ObjectId;
    name: string;
    role: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentStatusHistorySchema = new Schema<IPaymentStatusHistory>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', required: true, index: true },
    workRequestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    paymentMode: { type: String, enum: ['CASH', 'ONLINE', 'OTHER', ''] },
    paidAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      role: { type: String }
    },
    timestamp: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export const PaymentStatusHistory = mongoose.model<IPaymentStatusHistory>(
  'PaymentStatusHistory',
  PaymentStatusHistorySchema
);

