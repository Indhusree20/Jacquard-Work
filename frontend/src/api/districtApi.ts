import { apiClient } from './client';
import { IDistrict } from '../types';

export interface AdminDistrictResponse {
  districts: IDistrict[];
  meta: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
  };
}

export const districtApi = {
  // Public / User endpoint (Active districts only)
  getActiveDistricts: async (): Promise<{ success: boolean; districts?: IDistrict[]; data?: { districts: IDistrict[] } }> => {
    const res = await apiClient.get('/districts/active');
    return res.data;
  },

  // Admin endpoints
  getAdminDistricts: async (params?: {
    status?: 'all' | 'active' | 'inactive';
    search?: string;
  }): Promise<{ success: boolean; data: AdminDistrictResponse }> => {
    const res = await apiClient.get('/districts/admin/list', { params });
    return res.data;
  },

  activateDistricts: async (
    districtIds: string[]
  ): Promise<{ success: boolean; message: string; data: { activatedCount: number } }> => {
    const res = await apiClient.post('/districts/admin/activate', { districtIds });
    return res.data;
  },

  deactivateDistrict: async (
    districtId: string
  ): Promise<{ success: boolean; message: string; data: { district: IDistrict } }> => {
    const res = await apiClient.post('/districts/admin/deactivate', { districtId });
    return res.data;
  },

  toggleDistrictStatus: async (
    id: string,
    active: boolean
  ): Promise<{ success: boolean; message: string; data: { district: IDistrict } }> => {
    const res = await apiClient.patch(`/districts/admin/${id}/status`, { active });
    return res.data;
  },

  createDistrict: async (
    payload: Partial<IDistrict>
  ): Promise<{ success: boolean; message: string; data: { district: IDistrict } }> => {
    const res = await apiClient.post('/districts/admin', payload);
    return res.data;
  }
};
