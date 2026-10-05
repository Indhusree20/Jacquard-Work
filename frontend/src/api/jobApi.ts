import { apiClient } from './client';
import { IJob, IJobStatusHistory, IPayment, IWorkRequest } from '../types';

export const jobApi = {
  getJobs: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { jobs: IJob[]; total: number; page: number; pages: number };
    }>('/jobs', { params });
    return res.data;
  },

  getJobById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: {
        job: IJob;
        history: IJobStatusHistory[];
        payments: IPayment[];
        navigationUrl?: string;
      };
    }>(`/jobs/${id}`);
    return res.data;
  },

  updateJobStatus: async (
    id: string,
    data: {
      status: string;
      scheduledDate?: string;
      startTime?: string;
      endTime?: string;
      completionNotes?: string;
      note?: string;
    }
  ) => {
    const res = await apiClient.patch<{ success: boolean; data: { job: IJob } }>(
      `/jobs/${id}/status`,
      data
    );
    return res.data;
  },

  submitFeedback: async (id: string, data: { rating: number; feedback?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: { job: IJob } }>(
      `/jobs/${id}/feedback`,
      data
    );
    return res.data;
  },

  recordPayment: async (data: {
    jobId: string;
    amount: number;
    status: string;
    method: string;
    transactionReference?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: { payment: IPayment } }>(
      '/payments',
      data
    );
    return res.data;
  },

  getPayments: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { payments: IPayment[]; total: number; page: number; pages: number };
    }>('/payments', { params });
    return res.data;
  },

  getSchedule: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { worker: any; requests?: IWorkRequest[]; jobs?: IWorkRequest[] };
    }>('/schedules', { params });
    return res.data;
  },

  toggleAvailability: async (isAvailable: boolean) => {
    const res = await apiClient.patch<{ success: boolean; data: { user: any } }>(
      '/schedules/availability',
      { isAvailable }
    );
    return res.data;
  }
};
