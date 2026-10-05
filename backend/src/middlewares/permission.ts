import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Admin, AdminPermission } from '../models/Admin';

export const requirePermission = (permission: AdminPermission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      // PRIMARY_ADMIN has all permissions implicitly
      if (req.user.role === 'PRIMARY_ADMIN') {
        return next();
      }

      if (req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Admin access required.' });
        return;
      }

      const adminProfile = await Admin.findOne({ userId: req.user._id, status: 'ACTIVE' });
      if (!adminProfile) {
        res.status(403).json({ success: false, message: 'Active admin profile not found.' });
        return;
      }

      if (!adminProfile.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permission [${permission}].`
        });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error checking permissions.' });
    }
  };
};
