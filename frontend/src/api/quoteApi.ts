import { apiClient } from './client';
import { IQuote, IJob, IWorkRequest } from '../types';

export const quoteApi = {
  submitQuote: async (data: {
    requestId: string;
    baseCharge: number;
    additionalCharge: number;
    travelCharge: number;
    estimatedDays: number;
    notes?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: { quote: IQuote } }>(
      '/quotes',
      data
    );
    return res.data;
  },

  respondToQuote: async (
    quoteId: string,
    action: 'ACCEPT' | 'REJECT',
    rejectionReason?: string
  ) => {
    const res = await apiClient.patch<{
      success: boolean;
      data: { quote: IQuote; job?: IJob; workRequest?: IWorkRequest };
    }>(`/quotes/${quoteId}/respond`, { action, rejectionReason });
    return res.data;
  }
};
