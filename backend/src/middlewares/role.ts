import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    // PRIMARY_ADMIN can access all ADMIN endpoints
    if (allowedRoles.includes('ADMIN') && req.userRole === 'PRIMARY_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. This resource requires one of [${allowedRoles.join(', ')}] role.`
      });
      return;
    }

    next();
  };
};
