import { apiClient } from './client';
import { IUser } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; data: { token: string; user: IUser } }>(
      '/auth/login',
      credentials
    );
    return res.data;
  },

  register: async (formData: any) => {
    const res = await apiClient.post<{ success: boolean; data: { token: string; user: IUser } }>(
      '/auth/register',
      formData
    );
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; data: { user: IUser } }>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<IUser>) => {
    const res = await apiClient.patch<{ success: boolean; data: { user: IUser } }>(
      '/auth/profile',
      data
    );
    return res.data;
  }
};
