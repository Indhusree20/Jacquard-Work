import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { District } from '../models/District';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

const activateBatchSchema = z.object({
  districtIds: z.array(z.string().min(1)).min(1, 'Please select at least one district to activate.')
});

const deactivateSchema = z.object({
  districtId: z.string().min(1, 'District ID is required.')
});

const createDistrictSchema = z.object({
  name: z.object({
    en: z.string().min(2, 'English district name is required.'),
    ta: z.string().min(2, 'Tamil district name is required.')
  }),
  code: z.string().min(2).max(10).toUpperCase(),
  state: z.string().default('Tamil Nadu'),
  active: z.boolean().default(false),
  displayOrder: z.number().default(0),
  description: z
    .object({
      en: z.string().optional(),
      ta: z.string().optional()
    })
    .optional()
});

/**
 * Public / User endpoint: Get all currently ACTIVE districts.
 * Returns only districts enabled by Admin.
 */
export const getActiveDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const districts = await District.find({ active: true }).sort({ 'name.en': 1 });

    res.status(200).json({
      success: true,
      districts,
      data: { districts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: List all districts with optional status and search filtering.
 */
export const getAdminDistricts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, search } = req.query;
    const filter: any = {};

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      filter.$or = [
        { 'name.en': { $regex: term, $options: 'i' } },
        { 'name.ta': { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } }
      ];
    }

    const districts = await District.find(filter).sort({ active: -1, 'name.en': 1 });

    const totalCount = await District.countDocuments();
    const activeCount = await District.countDocuments({ active: true });
    const inactiveCount = totalCount - activeCount;

    res.status(200).json({
      success: true,
      data: {
        districts,
        meta: {
          totalCount,
          activeCount,
          inactiveCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Batch activate multiple districts from the master repository.
 */
export const activateDistricts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtIds } = activateBatchSchema.parse(req.body);

    const result = await District.updateMany(
      { _id: { $in: districtIds } },
      { $set: { active: true } }
    );

    const activatedDistricts = await District.find({ _id: { $in: districtIds } });
    const districtNames = activatedDistricts.map((d) => d.name.en).join(', ');

    await recordAuditLog(req, 'ACTIVATE_DISTRICTS', 'District', districtIds.join(','), {
      count: result.modifiedCount,
      districtNames
    });

    res.status(200).json({
      success: true,
      message: `Successfully activated ${result.modifiedCount} district(s).`,
      data: {
        activatedCount: result.modifiedCount,
        districts: activatedDistricts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Soft remove / deactivate a district.
 * Does NOT delete records to ensure historical data preservation.
 */
export const deactivateDistrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtId } = deactivateSchema.parse(req.body);

    const district = await District.findById(districtId);
    if (!district) {
      res.status(404).json({ success: false, message: 'District not found.' });
      return;
    }

    district.active = false;
    await district.save();

    await recordAuditLog(req, 'DEACTIVATE_DISTRICT', 'District', district._id.toString(), {
      districtName: district.name.en,
      state: district.state
    });

    res.status(200).json({
      success: true,
      message: `District "${district.name.en}" successfully removed from active list (Soft Deactivation).`,
      data: { district }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Toggle active status of a district.
 */
export const toggleDistrictStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const district = await District.findById(id);
    if (!district) {
      res.status(404).json({ success: false, message: 'District not found.' });
      return;
    }

    const newStatus = typeof active === 'boolean' ? active : !district.active;
    district.active = newStatus;
    await district.save();

    await recordAuditLog(
      req,
      newStatus ? 'ACTIVATE_DISTRICT' : 'DEACTIVATE_DISTRICT',
      'District',
      id,
      {
        districtName: district.name.en,
        active: newStatus
      }
    );

    res.status(200).json({
      success: true,
      message: `District "${district.name.en}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
      data: { district }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint: Create a new custom district in the master catalogue.
 */
export const createDistrict = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createDistrictSchema.parse(req.body);

    const existing = await District.findOne({
      $or: [
        { 'name.en': validated.name.en, state: validated.state },
        { code: validated.code, state: validated.state }
      ]
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A district with this name or code already exists in this state.'
      });
      return;
    }

    const district = await District.create({
      ...validated,
      createdBy: req.user?._id
    });

    await recordAuditLog(req, 'CREATE_DISTRICT', 'District', district._id.toString(), {
      districtName: district.name.en,
      code: district.code
    });

    res.status(201).json({
      success: true,
      message: 'District created in master repository successfully.',
      data: { district }
    });
  } catch (error) {
    next(error);
  }
};
