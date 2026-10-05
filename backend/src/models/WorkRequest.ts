import mongoose, { Document, Schema, Types } from 'mongoose';

export type WorkRequestStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'MASTER_ACCEPTED'
  | 'FINAL_CHARGES_PENDING_USER'
  | 'USER_FINAL_CONFIRMED'
  | 'USER_CONFIRMATION_EXPIRED'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'UNPAID' | 'PAID' | 'PARTIALLY_PAID';
export type PaymentMode = 'CASH' | 'ONLINE' | 'OTHER';

export interface IDesignFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IWorkRequestLocation {
  address: string;
  landmark?: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  lat: number;
  lng: number;
}

export interface IPricingBreakdownItem {
  label: {
    en: string;
    ta: string;
  };
  amount: number;
}

export interface IWorkRequestItem {
  serviceId: Types.ObjectId;
  serviceCode: string;
  serviceName: {
    en: string;
    ta: string;
  };
  optionKey: string;
  optionName: {
    en: string;
    ta: string;
  };
  pricingModel: 'PER_MONAI' | 'PER_SET' | 'PER_INCH' | 'FIXED_AMOUNT';
  unit: string;
  rate: number;
  inputValue: number; // e.g. Monai count, Inch width, Number of Sets, 1 for Fixed
  subtotal: number;
  pricingVersion: number;
}

export interface IPricingSnapshot {
  serviceNameSnapshot: {
    en: string;
    ta: string;
  };
  selectedOptionsSnapshot: Record<string, any>;
  pricingVersion: number;
  baseAmount: number;
  additionalAmount: number;
  totalAmount: number;
  currency: string;
  breakdown: IPricingBreakdownItem[];
  calculatedAt: Date;
}

export interface IFinalChargeSnapshot {
  baseServiceAmount: number;
  petrolAllowance: number;
  viluthuCharge: number;
  finalAmount: number;
  selectedDate: string;
  submittedBy: Types.ObjectId;
  submittedAt: Date;
  version: number;
  approvalDeadline: Date;
  userConfirmedAt?: Date;
  notes?: string;
}

export interface IWorkRequest extends Document {
  requestId: string;
  weaverId: Types.ObjectId;
  assignedWorkerId?: Types.ObjectId;
  workTypeId?: Types.ObjectId;
  serviceId?: Types.ObjectId;
  selectedOptions?: Record<string, any>;
  pricingSnapshot?: IPricingSnapshot;
  finalChargeSnapshot?: IFinalChargeSnapshot;
  selectedWorkDate?: string;
  approvalDeadline?: Date;
  items: IWorkRequestItem[];
  designFiles: IDesignFile[];
  quantity: number; // Number of looms / sets
  description?: string;
  additionalRequirements?: string;
  requiredDate: Date;
  preferredDate1?: string;
  preferredDate2?: string;
  preferredTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FLEXIBLE';
  location: IWorkRequestLocation;
  status: WorkRequestStatus;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  paidAmount?: number;
  paidAt?: Date;
  completedAt?: Date;
  completionNotes?: string;
  estimatedAmount?: number;
  quotedAmount?: number;
  finalAmount?: number;
  cancellationReason?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DesignFileSchema = new Schema<IDesignFile>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const WorkRequestLocationSchema = new Schema<IWorkRequestLocation>(
  {
    address: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, default: 'Tamil Nadu' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const PricingBreakdownItemSchema = new Schema<IPricingBreakdownItem>(
  {
    label: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const WorkRequestItemSchema = new Schema<IWorkRequestItem>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceCode: { type: String, required: true },
    serviceName: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    optionKey: { type: String, required: true },
    optionName: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    pricingModel: {
      type: String,
      enum: ['PER_MONAI', 'PER_SET', 'PER_INCH', 'FIXED_AMOUNT'],
      required: true
    },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    inputValue: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    pricingVersion: { type: Number, default: 1 }
  },
  { _id: false }
);

const PricingSnapshotSchema = new Schema<IPricingSnapshot>(
  {
    serviceNameSnapshot: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    selectedOptionsSnapshot: { type: Schema.Types.Mixed, default: {} },
    pricingVersion: { type: Number, default: 1 },
    baseAmount: { type: Number, required: true },
    additionalAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    breakdown: [PricingBreakdownItemSchema],
    calculatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const FinalChargeSnapshotSchema = new Schema<IFinalChargeSnapshot>(
  {
    baseServiceAmount: { type: Number, required: true },
    petrolAllowance: { type: Number, required: true, default: 0 },
    viluthuCharge: { type: Number, required: true, default: 0 },
    finalAmount: { type: Number, required: true },
    selectedDate: { type: String, required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    approvalDeadline: { type: Date, required: true },
    userConfirmedAt: { type: Date },
    notes: { type: String }
  },
  { _id: false }
);

const WorkRequestSchema = new Schema<IWorkRequest>(
  {
    requestId: { type: String, required: true, unique: true, uppercase: true, index: true },
    weaverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedWorkerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    workTypeId: { type: Schema.Types.ObjectId, ref: 'WorkType' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', index: true },
    selectedOptions: { type: Schema.Types.Mixed, default: {} },
    pricingSnapshot: { type: PricingSnapshotSchema },
    finalChargeSnapshot: { type: FinalChargeSnapshotSchema },
    selectedWorkDate: { type: String },
    approvalDeadline: { type: Date },
    items: { type: [WorkRequestItemSchema], default: [] },
    designFiles: [DesignFileSchema],
    quantity: { type: Number, required: true, min: 1, default: 1 },
    description: { type: String, required: false, default: '' },
    additionalRequirements: { type: String },
    requiredDate: { type: Date, required: true },
    preferredDate1: { type: String },
    preferredDate2: { type: String },
    preferredTime: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE'],
      default: 'FLEXIBLE'
    },
    location: { type: WorkRequestLocationSchema, required: true },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'UNDER_REVIEW',
        'QUOTED',
        'MASTER_ACCEPTED',
        'FINAL_CHARGES_PENDING_USER',
        'USER_FINAL_CONFIRMED',
        'USER_CONFIRMATION_EXPIRED',
        'CONFIRMED',
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED'
      ],
      default: 'REQUESTED',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'UNPAID', 'PAID', 'PARTIALLY_PAID'],
      default: 'UNPAID',
      index: true
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'ONLINE', 'OTHER']
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    completedAt: { type: Date },
    completionNotes: { type: String },
    estimatedAmount: { type: Number },
    quotedAmount: { type: Number },
    finalAmount: { type: Number },
    cancellationReason: { type: String },
    rejectionReason: { type: String }
  },
  {
    timestamps: true
  }
);

export const WorkRequest = mongoose.model<IWorkRequest>('WorkRequest', WorkRequestSchema);
