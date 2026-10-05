import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { District } from '../models/District';
import { Admin } from '../models/Admin';
import { ENV } from '../config/env';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['WEAVER', 'JACQUARD_WORKER']),
  districtId: z.string().optional(),
  district: z.string().optional(),
  experienceYears: z.number().optional(),
  specialization: z.array(z.string()).optional(),
  loomCount: z.number().optional(),
  businessName: z.string().optional(),
  preferredLanguage: z.enum(['en', 'ta']).optional(),
  location: z
    .object({
      address: z.string().optional(),
      landmark: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      districtId: z.string().optional(),
      pincode: z.string().optional(),
      state: z.string().default('Tamil Nadu'),
      lat: z.number().optional(),
      lng: z.number().optional()
    })
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
      return;
    }

    // Resolve and validate district from Admin District Master
    const districtQuery = validatedData.districtId || validatedData.location?.districtId;
    const districtName = validatedData.district || validatedData.location?.district;

    if (!districtQuery && !districtName) {
      res.status(400).json({
        success: false,
        message: 'District is required. Please select your district.'
      });
      return;
    }

    let districtDoc = null;
    if (districtQuery && mongoose.Types.ObjectId.isValid(districtQuery)) {
      districtDoc = await District.findById(districtQuery);
    } else if (districtName) {
      districtDoc = await District.findOne({
        $or: [
          { 'name.en': { $regex: new RegExp(`^${districtName.trim()}$`, 'i') } },
          { 'name.ta': districtName.trim() },
          { code: districtName.trim().toUpperCase() }
        ]
      });
    } else if (districtQuery) {
      districtDoc = await District.findOne({
        $or: [
          { 'name.en': { $regex: new RegExp(`^${districtQuery.trim()}$`, 'i') } },
          { code: districtQuery.trim().toUpperCase() }
        ]
      });
    }

    if (!districtDoc) {
      res.status(400).json({
        success: false,
        message: 'This district is currently unavailable for registration. Please select another active district.'
      });
      return;
    }

    if (!districtDoc.active) {
      res.status(400).json({
        success: false,
        message: 'This district is currently unavailable for registration. Please select another active district.'
      });
      return;
    }

    const resolvedCity = validatedData.location?.city || districtDoc.name.en;
    const resolvedAddress = validatedData.location?.address || `${resolvedCity} Handloom Cluster`;
    const resolvedPincode = validatedData.location?.pincode || '636001';
    const resolvedState = validatedData.location?.state || districtDoc.state || 'Tamil Nadu';
    const resolvedLat = validatedData.location?.lat ?? 11.6643;
    const resolvedLng = validatedData.location?.lng ?? 78.146;

    const resolvedLocation = {
      address: resolvedAddress,
      landmark: validatedData.location?.landmark,
      city: resolvedCity,
      district: districtDoc.name.en,
      districtId: districtDoc._id,
      pincode: resolvedPincode,
      state: resolvedState,
      lat: resolvedLat,
      lng: resolvedLng
    };

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const newUser = await User.create({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      phone: validatedData.phone,
      passwordHash,
      role: validatedData.role,
      experienceYears: validatedData.experienceYears,
      specialization: validatedData.specialization,
      loomCount: validatedData.loomCount,
      businessName: validatedData.businessName,
      preferredLanguage: validatedData.preferredLanguage || 'en',
      location: resolvedLocation,
      status: 'ACTIVE'
    });

    const token = generateToken(newUser);

    const userObj = newUser.toObject();
    delete (userObj as any).passwordHash;

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: userObj
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended or deactivated. Contact platform administrator.'
      });
      return;
    }

    let adminPermissions: string[] = [];
    if (user.role === 'ADMIN' || user.role === 'PRIMARY_ADMIN') {
      if (user.role === 'PRIMARY_ADMIN') {
        adminPermissions = [
          'MANAGE_USERS',
          'MANAGE_WORKERS',
          'MANAGE_WEAVERS',
          'MANAGE_ADMINS',
          'MANAGE_WORK_TYPES',
          'MANAGE_PRICING',
          'MANAGE_JOBS',
          'MANAGE_QUOTES',
          'VIEW_REPORTS',
          'MANAGE_SETTINGS'
        ];
      } else {
        const adminDoc = await Admin.findOne({ userId: user._id, status: 'ACTIVE' });
        adminPermissions = adminDoc ? adminDoc.permissions : [];
      }
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          ...userObj,
          permissions: adminPermissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    let permissions: string[] = [];
    if (user.role === 'PRIMARY_ADMIN') {
      permissions = [
        'MANAGE_USERS',
        'MANAGE_WORKERS',
        'MANAGE_WEAVERS',
        'MANAGE_ADMINS',
        'MANAGE_WORK_TYPES',
        'MANAGE_PRICING',
        'MANAGE_JOBS',
        'MANAGE_QUOTES',
        'VIEW_REPORTS',
        'MANAGE_SETTINGS'
      ];
    } else if (user.role === 'ADMIN') {
      const adminDoc = await Admin.findOne({ userId: user._id, status: 'ACTIVE' });
      permissions = adminDoc ? adminDoc.permissions : [];
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          permissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const {
      name,
      phone,
      businessName,
      loomCount,
      experienceYears,
      specialization,
      location,
      preferredLanguage,
      isAvailable
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(businessName !== undefined && { businessName }),
        ...(loomCount !== undefined && { loomCount }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(specialization && { specialization }),
        ...(location && { location }),
        ...(preferredLanguage && { preferredLanguage }),
        ...(isAvailable !== undefined && { isAvailable })
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await recordAuditLog(req, 'UPDATE_PROFILE', 'User', req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};
