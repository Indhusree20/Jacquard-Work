import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WorkType } from '../models/WorkType';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

const workTypeSchema = z.object({
  name: z.object({
    en: z.string().min(2),
    ta: z.string().min(2)
  }),
  code: z.string().min(2).toUpperCase(),
  description: z.object({
    en: z.string().min(5),
    ta: z.string().min(5)
  }),
  basePrice: z.number().min(0),
  unit: z.enum(['per_loom', 'per_design', 'per_day', 'fixed']),
  estimatedHours: z.number().min(1).default(8),
  active: z.boolean().default(true)
});

export const getWorkTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { active: true };
    const workTypes = await WorkType.find(filter).sort({ basePrice: 1 });

    res.status(200).json({
      success: true,
      data: { workTypes }
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkTypeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const workType = await WorkType.findById(id);

    if (!workType) {
      res.status(404).json({ success: false, message: 'Work type not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { workType }
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkType = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = workTypeSchema.parse(req.body);

    const existing = await WorkType.findOne({ code: validatedData.code });
    if (existing) {
      res.status(409).json({ success: false, message: 'Work type with this code already exists.' });
      return;
    }

    const newWorkType = await WorkType.create(validatedData);

    await recordAuditLog(req, 'CREATE_WORK_TYPE', 'WorkType', newWorkType._id.toString(), {
      code: validatedData.code,
      basePrice: validatedData.basePrice
    });

    res.status(201).json({
      success: true,
      message: 'Work type created successfully.',
      data: { workType: newWorkType }
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkType = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const workType = await WorkType.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!workType) {
      res.status(404).json({ success: false, message: 'Work type not found.' });
      return;
    }

    await recordAuditLog(req, 'UPDATE_WORK_TYPE', 'WorkType', id, updateData);

    res.status(200).json({
      success: true,
      message: 'Work type updated successfully.',
      data: { workType }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkType = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Soft delete (mark inactive)
    const workType = await WorkType.findByIdAndUpdate(id, { active: false }, { new: true });

    if (!workType) {
      res.status(404).json({ success: false, message: 'Work type not found.' });
      return;
    }

    await recordAuditLog(req, 'DISABLE_WORK_TYPE', 'WorkType', id);

    res.status(200).json({
      success: true,
      message: 'Work type deactivated successfully.',
      data: { workType }
    });
  } catch (error) {
    next(error);
  }
};
