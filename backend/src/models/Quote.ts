import mongoose, { Document, Schema, Types } from 'mongoose';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface IQuote extends Document {
  quoteId: string;
  requestId: Types.ObjectId;
  workerId: Types.ObjectId;
  baseCharge: number;
  additionalCharge: number;
  travelCharge: number;
  totalAmount: number;
  estimatedDays: number;
  notes?: string;
  status: QuoteStatus;
  validUntil?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    quoteId: { type: String, required: true, unique: true, uppercase: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkRequest', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    baseCharge: { type: Number, required: true, min: 0 },
    additionalCharge: { type: Number, default: 0, min: 0 },
    travelCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    estimatedDays: { type: Number, default: 1 },
    notes: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'SENT',
      index: true
    },
    validUntil: { type: Date },
    rejectionReason: { type: String }
  },
  {
    timestamps: true
  }
);

export const Quote = mongoose.model<IQuote>('Quote', QuoteSchema);
