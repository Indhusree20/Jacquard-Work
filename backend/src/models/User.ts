import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'WEAVER' | 'JACQUARD_WORKER' | 'ADMIN' | 'PRIMARY_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';

export interface IUserLocation {
  address: string;
  landmark?: string;
  city: string;
  district: string;
  districtId?: Types.ObjectId | string;
  pincode: string;
  state: string;
  lat: number;
  lng: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  preferredLanguage: 'en' | 'ta';
  experienceYears?: number;
  specialization?: string[];
  loomCount?: number;
  businessName?: string;
  location?: IUserLocation;
  isAvailable?: boolean; // For Jacquard Workers
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserLocationSchema = new Schema<IUserLocation>(
  {
    address: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    districtId: { type: Schema.Types.ObjectId, ref: 'District' },
    pincode: { type: String, required: true },
    state: { type: String, default: 'Tamil Nadu' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['WEAVER', 'JACQUARD_WORKER', 'ADMIN', 'PRIMARY_ADMIN'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    avatar: { type: String },
    preferredLanguage: { type: String, enum: ['en', 'ta'], default: 'en' },
    experienceYears: { type: Number },
    specialization: [{ type: String }],
    loomCount: { type: Number },
    businessName: { type: String },
    location: { type: UserLocationSchema },
    isAvailable: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
