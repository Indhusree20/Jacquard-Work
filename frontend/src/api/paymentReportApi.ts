import { apiClient } from './client';
import { IWorkRequest, IUnpaidSummary, IPaymentStatusHistory } from '../types';

export interface PaymentReportFilterParams {
  paymentStatus?: string;
  workStatus?: string;
  workerId?: string;
  district?: string;
  serviceId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const paymentReportApi = {
  getPaymentReports: async (params?: PaymentReportFilterParams) => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        records: IWorkRequest[];
        total: number;
        page: number;
        pages: number;
      };
    }>('/admin/payment-reports', { params });
    return res.data;
  },

  getUnpaidSummary: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        summary: IUnpaidSummary;
      };
    }>('/admin/payment-reports/unpaid-summary');
    return res.data;
  },

  getPaymentHistory: async (requestId: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        history: IPaymentStatusHistory[];
      };
    }>(`/admin/payment-reports/${requestId}/history`);
    return res.data;
  }
};
