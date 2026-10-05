import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDistrict extends Document {
  name: {
    en: string;
    ta: string;
  };
  code: string;
  state: string;
  active: boolean;
  displayOrder: number;
  description?: {
    en: string;
    ta: string;
  };
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ta: { type: String, required: true, trim: true }
    },
    code: { type: String, required: true, uppercase: true, trim: true },
    state: { type: String, required: true, default: 'Tamil Nadu', trim: true },
    active: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0 },
    description: {
      en: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

// Unique index for district name per state
DistrictSchema.index({ 'name.en': 1, state: 1 }, { unique: true });
DistrictSchema.index({ code: 1, state: 1 }, { unique: true });

export const District = mongoose.model<IDistrict>('District', DistrictSchema);
