import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkType extends Document {
  name: {
    en: string;
    ta: string;
  };
  code: string;
  description: {
    en: string;
    ta: string;
  };
  basePrice: number; // in INR ₹
  unit: 'per_loom' | 'per_design' | 'per_day' | 'fixed';
  estimatedHours: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkTypeSchema = new Schema<IWorkType>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ta: { type: String, required: true, trim: true }
    },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    basePrice: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['per_loom', 'per_design', 'per_day', 'fixed'],
      default: 'per_loom'
    },
    estimatedHours: { type: Number, default: 8 },
    active: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true
  }
);

export const WorkType = mongoose.model<IWorkType>('WorkType', WorkTypeSchema);
