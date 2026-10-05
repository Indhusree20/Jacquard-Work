import { apiClient } from './client';
import { IAdminUser, IUser, IWorkType, INotification } from '../types';

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get<{ success: boolean; data: { stats: any; recentActivities: any[] } }>(
      '/admin/stats'
    );
    return res.data;
  },

  listAdmins: async () => {
    const res = await apiClient.get<{ success: boolean; data: { admins: IAdminUser[] } }>(
      '/admin/admins'
    );
    return res.data;
  },

  createAdmin: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: { admin: any } }>(
      '/admin/admins',
      data
    );
    return res.data;
  },

  updateAdminPermissions: async (id: string, permissions: string[]) => {
    const res = await apiClient.patch<{ success: boolean; data: { admin: any } }>(
      `/admin/admins/${id}/permissions`,
      { permissions }
    );
    return res.data;
  },

  toggleAdminStatus: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: { admin: any } }>(
      `/admin/admins/${id}/status`
    );
    return res.data;
  },

  listUsers: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { users: IUser[]; total: number; page: number; pages: number };
    }>('/admin/users', { params });
    return res.data;
  },

  toggleUserStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<{ success: boolean; data: { user: IUser } }>(
      `/admin/users/${id}/status`,
      { status }
    );
    return res.data;
  },

  createWorkType: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: { workType: IWorkType } }>(
      '/work-types',
      data
    );
    return res.data;
  },

  updateWorkType: async (id: string, data: any) => {
    const res = await apiClient.patch<{ success: boolean; data: { workType: IWorkType } }>(
      `/work-types/${id}`,
      data
    );
    return res.data;
  },

  deleteWorkType: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; data: { workType: IWorkType } }>(
      `/work-types/${id}`
    );
    return res.data;
  },

  getReports: async () => {
    const res = await apiClient.get<{ success: boolean; data: any }>('/reports');
    return res.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: { notifications: INotification[]; unreadCount: number };
    }>('/notifications');
    return res.data;
  },

  markAsRead: async (id: string = 'all') => {
    const res = await apiClient.patch<{ success: boolean; message: string }>(
      `/notifications/${id}/read`
    );
    return res.data;
  }
};
