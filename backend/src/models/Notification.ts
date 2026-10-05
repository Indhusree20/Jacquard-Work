import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'WORK_REQUEST_SUBMITTED'
  | 'WORKER_ACCEPTED_REQUEST'
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'WORK_SCHEDULED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'WORK_CANCELLED'
  | 'PAYMENT_RECORDED'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: {
    en: string;
    ta: string;
  };
  message: {
    en: string;
    ta: string;
  };
  type: NotificationType;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    message: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    type: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
