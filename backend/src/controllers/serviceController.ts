import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Service } from '../models/Service';
import { PricingService } from '../services/pricing/pricing.service';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

const serviceOptionRuleSchema = z.object({
  optionKey: z.string().min(1),
  name: z.object({
    en: z.string().min(1),
    ta: z.string().min(1)
  }),
  pricingModel: z.enum(['PER_MONAI', 'PER_SET', 'PER_INCH', 'FIXED_AMOUNT']),
  unit: z.string().default('UNIT'),
  rate: z.number().min(0),
  minQuantity: z.number().optional(),
  maxQuantity: z.number().optional(),
  active: z.boolean().default(true),
  isDefault: z.boolean().optional(),
  description: z
    .object({
      en: z.string().optional(),
      ta: z.string().optional()
    })
    .optional()
});

const fieldOptionSchema = z.object({
  key: z.string().min(1),
  label: z.object({
    en: z.string().min(1),
    ta: z.string().min(1)
  }),
  additionalPrice: z.number().default(0),
  isDefault: z.boolean().optional()
});

const fieldDefinitionSchema = z.object({
  fieldKey: z.string().min(1),
  label: z.object({
    en: z.string().min(1),
    ta: z.string().min(1)
  }),
  fieldType: z.enum(['SELECT', 'RADIO', 'NUMBER', 'TEXT']).default('SELECT'),
  required: z.boolean().default(true),
  options: z.array(fieldOptionSchema).default([]),
  unit: z.string().optional(),
  helperText: z
    .object({
      en: z.string().optional(),
      ta: z.string().optional()
    })
    .optional()
});

const pricingRuleSchema = z.object({
  basePrice: z.number().min(0).default(0),
  pricingType: z.enum(['FIXED', 'PER_LOOM', 'MATRIX']).default('PER_LOOM'),
  optionAddons: z
    .array(
      z.object({
        fieldKey: z.string(),
        optionKey: z.string(),
        additionalAmount: z.number(),
        label: z
          .object({
            en: z.string(),
            ta: z.string()
          })
          .optional()
      })
    )
    .default([]),
  matrixRules: z
    .array(
      z.object({
        conditions: z.record(z.string()),
        price: z.number(),
        description: z
          .object({
            en: z.string(),
            ta: z.string()
          })
          .optional()
      })
    )
    .default([])
}).default({ basePrice: 0, pricingType: 'PER_LOOM', optionAddons: [], matrixRules: [] });

const createServiceSchema = z.object({
  name: z.object({
    en: z.string().min(2),
    ta: z.string().min(2)
  }),
  code: z.string().min(2).toUpperCase(),
  category: z.string().min(2),
  description: z.object({
    en: z.string().default(''),
    ta: z.string().default('')
  }),
  active: z.boolean().default(true),
  options: z.array(serviceOptionRuleSchema).default([]),
  fieldDefinitions: z.array(fieldDefinitionSchema).default([]),
  pricingConfig: pricingRuleSchema.optional()
});

const calculatePricingSchema = z.object({
  serviceId: z.string().min(1),
  selectedOptions: z.record(z.any()).default({}),
  quantity: z.preprocess((val) => Number(val), z.number().min(0).default(1))
});

const calculateItemsSchema = z.object({
  items: z.array(
    z.object({
      serviceId: z.string().min(1),
      optionKey: z.string().min(1),
      inputValue: z.preprocess((val) => Number(val), z.number().min(0).default(1))
    })
  ).min(1)
});

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    const filter: any = { active: true };
    if (category) filter.category = category;

    const services = await Service.find(filter).sort({ category: 1, 'pricingConfig.basePrice': 1 });

    res.status(200).json({
      success: true,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found in catalogue.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

export const calculatePricingPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serviceId, selectedOptions, quantity } = calculatePricingSchema.parse(req.body);

    const calculation = await PricingService.calculatePrice(serviceId, selectedOptions, quantity);

    res.status(200).json({
      success: true,
      data: { calculation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Pricing calculation failed.'
    });
  }
};

export const calculateItemsPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items } = calculateItemsSchema.parse(req.body);

    const calculation = await PricingService.calculateItems(items);

    res.status(200).json({
      success: true,
      data: { calculation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Multi-item pricing calculation failed.'
    });
  }
};

// Admin Endpoints
export const listAdminServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const services = await Service.find().sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createServiceSchema.parse(req.body);

    const existing = await Service.findOne({ code: validated.code });
    if (existing) {
      res.status(409).json({ success: false, message: 'Service with this code already exists.' });
      return;
    }

    const service = await Service.create({
      ...validated,
      version: 1,
      createdBy: req.user?._id
    });

    await recordAuditLog(req, 'CREATE_SERVICE', 'Service', service._id.toString(), {
      code: service.code,
      name: service.name.en,
      version: service.version
    });

    res.status(201).json({
      success: true,
      message: 'Jacquard service created successfully.',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await Service.findById(id);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    const updateData = req.body;
    // Increment version to enforce price snapshot immutability
    const newVersion = (existing.version || 1) + 1;

    const updated = await Service.findByIdAndUpdate(
      id,
      {
        ...updateData,
        version: newVersion
      },
      { new: true, runValidators: true }
    );

    await recordAuditLog(req, 'UPDATE_SERVICE', 'Service', id, {
      previousVersion: existing.version,
      newVersion
    });

    res.status(200).json({
      success: true,
      message: `Service updated successfully (Configuration Version ${newVersion}).`,
      data: { service: updated }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleServiceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    service.active = !service.active;
    await service.save();

    await recordAuditLog(req, 'TOGGLE_SERVICE_STATUS', 'Service', id, { active: service.active });

    res.status(200).json({
      success: true,
      message: `Service ${service.active ? 'activated' : 'deactivated'} successfully.`,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};
