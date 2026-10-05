import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Admin, AdminPermission } from '../models/Admin';
import { WorkRequest } from '../models/WorkRequest';
import { Quote } from '../models/Quote';
import { Job } from '../models/Job';
import { Payment } from '../models/Payment';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middlewares/auth';
import { recordAuditLog } from '../middlewares/audit';

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  department: z.string().optional(),
  notes: z.string().optional(),
  permissions: z.array(
    z.enum([
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
    ])
  )
});

const updatePermissionsSchema = z.object({
  permissions: z.array(
    z.enum([
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
    ])
  )
});

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalWeavers,
      totalWorkers,
      totalAdmins,
      totalRequests,
      pendingRequests,
      activeJobs,
      completedJobs,
      totalQuotes,
      paymentAggregate
    ] = await Promise.all([
      User.countDocuments({ role: 'WEAVER' }),
      User.countDocuments({ role: 'JACQUARD_WORKER' }),
      User.countDocuments({ role: { $in: ['ADMIN', 'PRIMARY_ADMIN'] } }),
      WorkRequest.countDocuments(),
      WorkRequest.countDocuments({ status: { $in: ['REQUESTED', 'UNDER_REVIEW', 'QUOTED'] } }),
      Job.countDocuments({ status: { $in: ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'] } }),
      Job.countDocuments({ status: 'COMPLETED' }),
      Quote.countDocuments(),
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalCollected: {
              $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] }
            },
            totalPending: {
              $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, '$amount', 0] }
            }
          }
        }
      ])
    ]);

    // Recent activities from audit log
    const recentActivities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalWeavers,
          totalWorkers,
          totalAdmins,
          totalRequests,
          pendingRequests,
          activeJobs,
          completedJobs,
          totalQuotes,
          totalCollected: paymentAggregate[0]?.totalCollected || 0,
          totalPending: paymentAggregate[0]?.totalPending || 0
        },
        recentActivities
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'PRIMARY_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only the Primary Administrator can create new admins.'
      });
      return;
    }

    const { name, email, phone, password, department, notes, permissions } =
      createAdminSchema.parse(req.body);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email address already in use.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const newAdmin = await Admin.create({
      userId: newUser._id,
      permissions: permissions as AdminPermission[],
      createdBy: req.user._id,
      department,
      notes,
      status: 'ACTIVE'
    });

    await recordAuditLog(req, 'CREATE_ADMIN', 'Admin', newAdmin._id.toString(), {
      email,
      permissions
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      data: {
        admin: {
          id: newAdmin._id,
          userId: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          department: newAdmin.department,
          permissions: newAdmin.permissions,
          status: newAdmin.status,
          createdAt: newAdmin.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listAdmins = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admins = await Admin.find()
      .populate('userId', 'name email phone role status createdAt')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'PRIMARY_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only the Primary Administrator can modify admin permissions.'
      });
      return;
    }

    const { id } = req.params;
    const { permissions } = updatePermissionsSchema.parse(req.body);

    const admin = await Admin.findByIdAndUpdate(
      id,
      { permissions: permissions as AdminPermission[] },
      { new: true }
    ).populate('userId', 'name email');

    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin record not found.' });
      return;
    }

    await recordAuditLog(req, 'UPDATE_ADMIN_PERMISSIONS', 'Admin', id, { permissions });

    res.status(200).json({
      success: true,
      message: 'Admin permissions updated successfully.',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'PRIMARY_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only the Primary Administrator can enable or disable admin accounts.'
      });
      return;
    }

    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin record not found.' });
      return;
    }

    const newStatus = admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    admin.status = newStatus;
    await admin.save();

    // Also update the User status
    await User.findByIdAndUpdate(admin.userId, {
      status: newStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
    });

    await recordAuditLog(req, 'TOGGLE_ADMIN_STATUS', 'Admin', id, { newStatus });

    res.status(200).json({
      success: true,
      message: `Admin account has been ${newStatus === 'ACTIVE' ? 'activated' : 'disabled'}.`,
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, district, status, search, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (district) query['location.district'] = district;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.role === 'PRIMARY_ADMIN') {
      res.status(403).json({ success: false, message: 'Primary Admin status cannot be changed.' });
      return;
    }

    user.status = status;
    await user.save();

    await recordAuditLog(req, 'UPDATE_USER_STATUS', 'User', id, { newStatus: status });

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
