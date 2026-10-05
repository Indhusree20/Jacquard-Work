import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface IPayment extends Document {
  paymentId: string;
  jobId: Types.ObjectId;
  requestId: Types.ObjectId;
  weaverId: Types.ObjectId;
  workerId: Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, uppercase: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', required: true, index: true },
    weaverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    method: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
      default: 'UPI'
    },
    transactionReference: { type: String },
    notes: { type: String },
    paidAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
