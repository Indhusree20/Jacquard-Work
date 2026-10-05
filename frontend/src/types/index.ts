export type UserRole = 'WEAVER' | 'JACQUARD_WORKER' | 'ADMIN' | 'PRIMARY_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';

export interface IUserLocation {
  address: string;
  landmark?: string;
  city: string;
  district: string;
  pincode: string;
  state?: string;
  lat: number;
  lng: number;
}

export interface IDistrict {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  code: string;
  state: string;
  active: boolean;
  displayOrder?: number;
  description?: {
    en: string;
    ta: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  preferredLanguage?: 'en' | 'ta';
  experienceYears?: number;
  specialization?: string[];
  loomCount?: number;
  businessName?: string;
  location?: IUserLocation;
  isAvailable?: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface IWorkType {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  code: string;
  description: {
    en: string;
    ta: string;
  };
  basePrice: number;
  unit: 'per_loom' | 'per_design' | 'per_day' | 'fixed';
  estimatedHours: number;
  active: boolean;
}

export interface IDesignFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export type ServiceCategory =
  | 'BORDER'
  | 'SELF'
  | 'TURNING'
  | 'STAND'
  | 'BOX'
  | 'EMBOSS'
  | 'OTHER';

export type PricingModel = 'PER_MONAI' | 'PER_SET' | 'PER_INCH' | 'FIXED_AMOUNT';
export type PaymentStatus = 'PENDING' | 'UNPAID' | 'PAID' | 'PARTIALLY_PAID';
export type PaymentMode = 'CASH' | 'ONLINE' | 'OTHER';

export interface IServiceOptionRule {
  optionKey: string;
  name: {
    en: string;
    ta: string;
  };
  pricingModel: PricingModel;
  unit: string;
  rate: number;
  minQuantity?: number;
  maxQuantity?: number;
  active: boolean;
  isDefault?: boolean;
  description?: {
    en: string;
    ta: string;
  };
}

export type FieldInputType = 'SELECT' | 'RADIO' | 'NUMBER' | 'TEXT';

export interface IFieldOption {
  key: string;
  label: {
    en: string;
    ta: string;
  };
  additionalPrice?: number;
  isDefault?: boolean;
}

export interface IFieldDefinition {
  fieldKey: string;
  label: {
    en: string;
    ta: string;
  };
  fieldType: FieldInputType;
  required: boolean;
  options: IFieldOption[];
  unit?: string;
  helperText?: {
    en: string;
    ta: string;
  };
}

export interface IOptionAddon {
  fieldKey: string;
  optionKey: string;
  additionalAmount: number;
  label?: {
    en: string;
    ta: string;
  };
}

export interface IMatrixPricingRule {
  conditions: Record<string, string>;
  price: number;
  description?: {
    en: string;
    ta: string;
  };
}

export interface IPricingConfig {
  basePrice: number;
  pricingType: 'FIXED' | 'PER_LOOM' | 'MATRIX';
  optionAddons: IOptionAddon[];
  matrixRules: IMatrixPricingRule[];
}

export interface IService {
  _id: string;
  name: {
    en: string;
    ta: string;
  };
  code: string;
  category: ServiceCategory | string;
  description: {
    en: string;
    ta: string;
  };
  active: boolean;
  version: number;
  options: IServiceOptionRule[];
  fieldDefinitions: IFieldDefinition[];
  pricingConfig: IPricingConfig;
  createdAt: string;
  updatedAt: string;
}

export interface IPricingBreakdownItem {
  label: {
    en: string;
    ta: string;
  };
  amount: number;
}

export interface IWorkRequestItem {
  serviceId: string | IService;
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
  pricingModel: PricingModel;
  unit: string;
  rate: number;
  inputValue: number;
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
  calculatedAt: string;
}

export interface PricingCalculationResult {
  serviceId: string;
  serviceName: { en: string; ta: string };
  pricingVersion: number;
  baseAmount: number;
  additionalAmount: number;
  totalAmount: number;
  currency: string;
  breakdown: IPricingBreakdownItem[];
  selectedOptions: Record<string, any>;
  quantity: number;
  items?: IWorkRequestItem[];
}

export interface IFinalChargeSnapshot {
  baseServiceAmount: number;
  petrolAllowance: number;
  viluthuCharge: number;
  finalAmount: number;
  selectedDate: string;
  submittedBy: string | IUser;
  submittedAt: string;
  version: number;
  approvalDeadline?: string;
  userConfirmedAt?: string;
  notes?: string;
}

export type WorkRequestStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'CONFIRMED'
  | 'MASTER_ACCEPTED'
  | 'FINAL_CHARGES_PENDING_USER'
  | 'USER_FINAL_CONFIRMED'
  | 'USER_CONFIRMATION_EXPIRED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface IWorkRequest {
  _id: string;
  requestId: string;
  weaverId: IUser;
  assignedWorkerId?: IUser;
  serviceId?: IService | string;
  selectedOptions?: Record<string, any>;
  pricingSnapshot?: IPricingSnapshot;
  items: IWorkRequestItem[];
  workTypeId?: IWorkType;
  designFiles: IDesignFile[];
  quantity: number;
  description?: string;
  additionalRequirements?: string;
  requiredDate: string;
  preferredDate1?: string;
  preferredDate2?: string;
  preferredTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FLEXIBLE';
  location: IUserLocation;
  status: WorkRequestStatus;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  paidAmount?: number;
  paidAt?: string;
  completedAt?: string;
  completionNotes?: string;
  estimatedAmount?: number;
  quotedAmount?: number;
  finalAmount?: number;
  selectedWorkDate?: string;
  approvalDeadline?: string;
  finalChargeSnapshot?: IFinalChargeSnapshot;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentStatusHistory {
  _id: string;
  requestId: string;
  workerId?: IUser;
  previousStatus: string;
  newStatus: string;
  paymentMode?: PaymentMode;
  amount?: number;
  paidAmount?: number;
  notes?: string;
  recordedBy?: IUser;
  timestamp: string;
  createdAt: string;
}

export interface IUnpaidSummary {
  totalUnpaidCompletedJobs: number;
  totalOutstandingCompletedAmount: number;
  totalAllUnpaidJobs: number;
  totalAllOutstandingAmount: number;
  totalPaidJobs: number;
  totalCollectedAmount: number;
  unpaidByDistrict: Array<{ district: string; count: number; amount: number }>;
  unpaidByWorker: Array<{ workerId: string; workerName: string; count: number; amount: number }>;
}


export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface IQuote {
  _id: string;
  quoteId: string;
  requestId: string | IWorkRequest;
  workerId: IUser;
  baseCharge: number;
  additionalCharge: number;
  travelCharge: number;
  totalAmount: number;
  estimatedDays: number;
  notes?: string;
  status: QuoteStatus;
  rejectionReason?: string;
  createdAt: string;
}

export type JobLifecycleStatus =
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IJob {
  _id: string;
  jobId: string;
  requestId: IWorkRequest;
  quoteId: IQuote;
  weaverId: IUser;
  workerId: IUser;
  workTypeId: IWorkType;
  status: JobLifecycleStatus;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  actualStartTime?: string;
  actualCompletionTime?: string;
  completionNotes?: string;
  rating?: number;
  feedback?: string;
  totalAgreedAmount: number;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: string;
}

export interface IJobStatusHistory {
  _id: string;
  jobId?: string;
  requestId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: {
    _id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  note?: string;
}

export interface IPayment {
  _id: string;
  paymentId: string;
  jobId: IJob;
  requestId: string;
  weaverId: IUser;
  workerId: IUser;
  amount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
  method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transactionReference?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: {
    en: string;
    ta: string;
  };
  message: {
    en: string;
    ta: string;
  };
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface IAdminUser {
  _id: string;
  userId: IUser;
  permissions: string[];
  department?: string;
  status: 'ACTIVE' | 'DISABLED';
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}
