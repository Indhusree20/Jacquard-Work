import { apiClient } from './client';
import { IService, PricingCalculationResult } from '../types';

export interface PricingCalculatePayload {
  serviceId: string;
  selectedOptions: Record<string, any>;
  quantity?: number;
}

export const serviceApi = {
  // Public / Weaver endpoints
  getAllServices: async (category?: string): Promise<{ success: boolean; data: IService[] }> => {
    const params = category ? { category } : {};
    const res = await apiClient.get('/services', { params });
    const list = res.data?.data?.services || res.data?.data || [];
    return { success: res.data?.success ?? true, data: list };
  },

  getServiceById: async (id: string): Promise<{ success: boolean; data: IService }> => {
    const res = await apiClient.get(`/services/${id}`);
    const item = res.data?.data?.service || res.data?.data;
    return { success: res.data?.success ?? true, data: item };
  },

  calculatePricing: async (
    payload: PricingCalculatePayload
  ): Promise<{ success: boolean; data: PricingCalculationResult }> => {
    const res = await apiClient.post('/pricing/calculate', payload);
    const calculation = res.data?.data?.calculation || res.data?.data;
    return { success: res.data?.success ?? true, data: calculation };
  },

  calculateItems: async (
    items: Array<{ serviceId: string; optionKey: string; inputValue: number }>
  ): Promise<{ success: boolean; data: { items: any[]; totalAmount: number; breakdown: any[]; currency: string } }> => {
    const res = await apiClient.post('/pricing/calculate-items', { items });
    const calculation = res.data?.data?.calculation || res.data?.data;
    return { success: res.data?.success ?? true, data: calculation };
  },


  // Admin endpoints
  getAdminServices: async (params?: { category?: string; active?: boolean }): Promise<{ success: boolean; data: IService[] }> => {
    const res = await apiClient.get('/services/admin/list', { params });
    const list = res.data?.data?.services || res.data?.data || [];
    return { success: res.data?.success ?? true, data: list };
  },

  createService: async (serviceData: Partial<IService>): Promise<{ success: boolean; data: IService }> => {
    const res = await apiClient.post('/services/admin', serviceData);
    const item = res.data?.data?.service || res.data?.data;
    return { success: res.data?.success ?? true, data: item };
  },

  updateService: async (id: string, serviceData: Partial<IService>): Promise<{ success: boolean; data: IService }> => {
    const res = await apiClient.patch(`/services/admin/${id}`, serviceData);
    const item = res.data?.data?.service || res.data?.data;
    return { success: res.data?.success ?? true, data: item };
  },

  toggleServiceStatus: async (id: string, active: boolean): Promise<{ success: boolean; data: IService }> => {
    const res = await apiClient.patch(`/services/admin/${id}/status`, { active });
    const item = res.data?.data?.service || res.data?.data;
    return { success: res.data?.success ?? true, data: item };
  }
};
