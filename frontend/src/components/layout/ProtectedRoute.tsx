import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading Jacquard Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    // Redirect to proper role dashboard
    if (user.role === 'WEAVER') return <Navigate to="/weaver/dashboard" replace />;
    if (user.role === 'JACQUARD_WORKER') return <Navigate to="/worker/dashboard" replace />;
    if (user.role === 'ADMIN' || user.role === 'PRIMARY_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 m-8">
        <h3 className="text-base font-bold text-red-700">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-2">
          Your admin account does not possess the required permission: [{requiredPermission}].
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
