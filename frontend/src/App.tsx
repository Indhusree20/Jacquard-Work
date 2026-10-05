import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ThariBackground } from './components/layout/ThariBackground';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Weaver Pages (Work Request Lifecycle)
import { WeaverDashboard } from './pages/weaver/WeaverDashboard';
import { NewWorkRequestPage } from './pages/weaver/NewWorkRequestPage';
import { MyRequestsPage } from './pages/weaver/MyRequestsPage';
import { RequestDetailsPage } from './pages/weaver/RequestDetailsPage';
import { UserFinalConfirmationPage } from './pages/weaver/UserFinalConfirmationPage';
import { WorkRequestSuccessPage } from './pages/weaver/WorkRequestSuccessPage';
import { WeaverProfilePage } from './pages/weaver/WeaverProfilePage';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { AvailableRequestsPage } from './pages/worker/AvailableRequestsPage';
import { WorkerRequestDetailsPage } from './pages/worker/WorkerRequestDetailsPage';
import { WorkerJobsPage } from './pages/worker/WorkerJobsPage';
import { WorkerJobDetailsPage } from './pages/worker/WorkerJobDetailsPage';
import { WorkerSchedulePage } from './pages/worker/WorkerSchedulePage';
import { WorkerChargesPage } from './pages/worker/WorkerChargesPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAdminsPage } from './pages/admin/AdminAdminsPage';
import { AdminWorkTypesPage } from './pages/admin/AdminWorkTypesPage';
import { AdminServiceCataloguePage } from './pages/admin/AdminServiceCataloguePage';
import { AdminDistrictsPage } from './pages/admin/AdminDistrictsPage';
import { AdminJobsQuotesPage } from './pages/admin/AdminJobsQuotesPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPaymentReportsPage } from './pages/admin/AdminPaymentReportsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ThariBackground intensity="default">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Weaver Portal */}
                  <Route
                    path="/weaver"
                    element={
                      <ProtectedRoute allowedRoles={['WEAVER']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<WeaverDashboard />} />
                    <Route path="requests/new" element={<NewWorkRequestPage />} />
                    <Route path="requests/submitted/:id" element={<WorkRequestSuccessPage />} />
                    <Route path="requests/success/:id" element={<WorkRequestSuccessPage />} />
                    <Route path="requests" element={<MyRequestsPage />} />
                    <Route path="requests/:id" element={<RequestDetailsPage />} />
                    <Route path="requests/:id/confirm-final" element={<UserFinalConfirmationPage />} />
                    <Route path="profile" element={<WeaverProfilePage />} />
                    
                    {/* Safe redirects for deprecated My Job routes */}
                    <Route path="jobs" element={<Navigate to="/weaver/requests" replace />} />
                    <Route path="jobs/:id" element={<Navigate to="/weaver/requests" replace />} />
                    <Route path="history" element={<Navigate to="/weaver/requests" replace />} />
                  </Route>

                  {/* Jacquard Worker Portal */}
                  <Route
                    path="/worker"
                    element={
                      <ProtectedRoute allowedRoles={['JACQUARD_WORKER']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<WorkerDashboard />} />
                    <Route path="available" element={<AvailableRequestsPage />} />
                    <Route path="requests/:id" element={<WorkerRequestDetailsPage />} />
                    <Route path="jobs" element={<WorkerJobsPage />} />
                    <Route path="jobs/:id" element={<WorkerJobDetailsPage />} />
                    <Route path="schedule" element={<WorkerSchedulePage />} />
                    <Route path="charges" element={<WorkerChargesPage />} />
                    <Route path="history" element={<WorkerJobsPage />} />
                    <Route path="profile" element={<WorkerProfilePage />} />
                  </Route>

                  {/* Admin Portal */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'PRIMARY_ADMIN']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="districts" element={<AdminDistrictsPage />} />
                    <Route path="services" element={<AdminServiceCataloguePage />} />
                    <Route path="payment-reports" element={<AdminPaymentReportsPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="admins" element={<AdminAdminsPage />} />
                    <Route path="work-types" element={<AdminWorkTypesPage />} />
                    <Route path="jobs-quotes" element={<AdminJobsQuotesPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="settings" element={<AdminUsersPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ThariBackground>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};
