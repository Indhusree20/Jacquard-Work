import { AuthRequest } from './auth';
import { AuditLog } from '../models/AuditLog';

export const recordAuditLog = async (
  req: AuthRequest,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, any>
) => {
  try {
    await AuditLog.create({
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action,
      entity,
      entityId,
      details,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('[AuditLog] Error recording audit log:', err);
  }
};
