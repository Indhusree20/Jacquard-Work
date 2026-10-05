import mongoose, { Document, Schema, Types } from 'mongoose';

export type AdminPermission =
  | 'MANAGE_USERS'
  | 'MANAGE_WORKERS'
  | 'MANAGE_WEAVERS'
  | 'MANAGE_ADMINS'
  | 'MANAGE_WORK_TYPES'
  | 'MANAGE_PRICING'
  | 'MANAGE_JOBS'
  | 'MANAGE_QUOTES'
  | 'VIEW_REPORTS'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_DISTRICTS';

export interface IAdmin extends Document {
  userId: Types.ObjectId;
  permissions: AdminPermission[];
  status: 'ACTIVE' | 'DISABLED';
  createdBy?: Types.ObjectId;
  department?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    permissions: [
      {
        type: String,
        enum: [
          'MANAGE_USERS',
          'MANAGE_WORKERS',
          'MANAGE_WEAVERS',
          'MANAGE_ADMINS',
          'MANAGE_WORK_TYPES',
          'MANAGE_PRICING',
          'MANAGE_JOBS',
          'MANAGE_QUOTES',
          'VIEW_REPORTS',
          'MANAGE_SETTINGS',
          'MANAGE_DISTRICTS'
        ]
      }
    ],
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    department: { type: String },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
