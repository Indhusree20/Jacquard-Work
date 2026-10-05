import mongoose, { Document, Schema, Types } from 'mongoose';
import { IPricingBreakdownItem } from './WorkRequest';
export { IPricingBreakdownItem };

export type ServiceCategory =
  | 'BORDER'
  | 'SELF'
  | 'TURNING'
  | 'STAND'
  | 'BOX'
  | 'EMBOSS'
  | 'M_POST'
  | 'OTHER';


export type PricingModel = 'PER_MONAI' | 'PER_SET' | 'PER_INCH' | 'FIXED_AMOUNT';
export type FieldInputType = 'SELECT' | 'RADIO' | 'NUMBER' | 'TEXT';

export interface IServiceOptionRule {
  optionKey: string; // e.g. "ONE_SIDE_BORDER", "DOUBLE_SIDE_BORDER", "120_MONAI_SET", "240_MONAI_SET", "ONE_SIDE_TURNING"
  name: {
    en: string;
    ta: string;
  };
  pricingModel: PricingModel;
  unit: string; // "MONAI" | "SET" | "INCH" | "FIXED" | string
  rate: number; // e.g. 6 (₹6/monai), 180 (₹180/set), 100 (₹100/inch), 1500 (fixed ₹1500)
  minQuantity?: number;
  maxQuantity?: number;
  active: boolean;
  isDefault?: boolean;
  description?: {
    en: string;
    ta: string;
  };
}

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

export interface IService extends Document {
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
  options: IServiceOptionRule[]; // Prompt 2.3: Sub-types with dynamic pricing models
  fieldDefinitions: IFieldDefinition[];
  pricingConfig: IPricingConfig;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceOptionRuleSchema = new Schema<IServiceOptionRule>(
  {
    optionKey: { type: String, required: true },
    name: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    pricingModel: {
      type: String,
      enum: ['PER_MONAI', 'PER_SET', 'PER_INCH', 'FIXED_AMOUNT'],
      required: true
    },
    unit: { type: String, required: true, default: 'UNIT' },
    rate: { type: Number, required: true, min: 0 },
    minQuantity: { type: Number, default: 1 },
    maxQuantity: { type: Number },
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    description: {
      en: { type: String },
      ta: { type: String }
    }
  },
  { _id: false }
);

const FieldOptionSchema = new Schema<IFieldOption>(
  {
    key: { type: String, required: true },
    label: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    additionalPrice: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const FieldDefinitionSchema = new Schema<IFieldDefinition>(
  {
    fieldKey: { type: String, required: true },
    label: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    fieldType: {
      type: String,
      enum: ['SELECT', 'RADIO', 'NUMBER', 'TEXT'],
      default: 'SELECT'
    },
    required: { type: Boolean, default: true },
    options: [FieldOptionSchema],
    unit: { type: String },
    helperText: {
      en: { type: String },
      ta: { type: String }
    }
  },
  { _id: false }
);

const OptionAddonSchema = new Schema<IOptionAddon>(
  {
    fieldKey: { type: String, required: true },
    optionKey: { type: String, required: true },
    additionalAmount: { type: Number, required: true },
    label: {
      en: { type: String },
      ta: { type: String }
    }
  },
  { _id: false }
);

const MatrixPricingRuleSchema = new Schema<IMatrixPricingRule>(
  {
    conditions: { type: Schema.Types.Mixed, required: true },
    price: { type: Number, required: true },
    description: {
      en: { type: String },
      ta: { type: String }
    }
  },
  { _id: false }
);

const PricingConfigSchema = new Schema<IPricingConfig>(
  {
    basePrice: { type: Number, default: 0 },
    pricingType: {
      type: String,
      enum: ['FIXED', 'PER_LOOM', 'MATRIX'],
      default: 'PER_LOOM'
    },
    optionAddons: [OptionAddonSchema],
    matrixRules: [MatrixPricingRuleSchema]
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ta: { type: String, required: true, trim: true }
    },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: ['BORDER', 'SELF', 'TURNING', 'STAND', 'BOX', 'EMBOSS', 'M_POST', 'OTHER'],
      required: true,
      index: true
    },
    description: {
      en: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    active: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    options: { type: [ServiceOptionRuleSchema], default: [] },
    fieldDefinitions: { type: [FieldDefinitionSchema], default: [] },
    pricingConfig: { type: PricingConfigSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

export const Service = mongoose.model<IService>('Service', ServiceSchema);
