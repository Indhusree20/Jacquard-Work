import { apiClient } from './client';
import { IWorkRequest, IWorkType, IQuote, IJob, IJobStatusHistory } from '../types';

export const workRequestApi = {
  getWorkTypes: async () => {
    const res = await apiClient.get<{ success: boolean; data: { workTypes: IWorkType[] } }>(
      '/work-types'
    );
    return res.data;
  },

  createWorkRequest: async (formData: FormData) => {
    const res = await apiClient.post<{ success: boolean; data: { workRequest: IWorkRequest } }>(
      '/work-requests',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return res.data;
  },

  getWorkRequests: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { requests: IWorkRequest[]; total: number; page: number; pages: number };
    }>('/work-requests', { params });
    return res.data;
  },

  getWorkRequestById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        workRequest: IWorkRequest;
        quotes: IQuote[];
        history: IJobStatusHistory[];
        job?: IJob;
      };
    }>(`/work-requests/${id}`);
    return res.data;
  },

  cancelWorkRequest: async (id: string, reason: string) => {
    const res = await apiClient.patch<{ success: boolean; data: { workRequest: IWorkRequest } }>(
      `/work-requests/${id}/cancel`,
      { reason }
    );
    return res.data;
  },

  completeWorkRequest: async (
    id: string,
    payload: {
      paymentStatus: 'PAID' | 'UNPAID';
      paymentMode?: string;
      paidAmount?: number;
      paymentDate?: string;
      completionNotes?: string;
    }
  ) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { workRequest: IWorkRequest } }>(
      `/work-requests/${id}/complete`,
      payload
    );
    return res.data;
  },

  updatePaymentStatus: async (
    id: string,
    payload: {
      paymentStatus: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
      paymentMode?: string;
      paidAmount?: number;
      notes?: string;
    }
  ) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: { workRequest: IWorkRequest } }>(
      `/work-requests/${id}/payment-status`,
      payload
    );
    return res.data;
  },

  submitMasterCharges: async (
    id: string,
    payload: {
      selectedDate: string;
      petrolAllowance: number;
      viluthuCharge: number;
      notes?: string;
      confirmationBufferDays?: number;
    }
  ) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { workRequest: IWorkRequest } }>(
      `/work-requests/${id}/master-charges`,
      payload
    );
    return res.data;
  },

  userConfirmFinalCharges: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { workRequest: IWorkRequest } }>(
      `/work-requests/${id}/user-confirm-final`
    );
    return res.data;
  }
};


