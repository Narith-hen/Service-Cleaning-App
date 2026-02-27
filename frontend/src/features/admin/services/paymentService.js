import api from '../../../services/api';

export const paymentService = {
  getPayments: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  getPaymentById: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },

  getTransactions: async (params = {}) => {
    const response = await api.get('/admin/payments/transactions', { params });
    return response.data;
  },

  getPayouts: async (params = {}) => {
    const response = await api.get('/admin/payments/payouts', { params });
    return response.data;
  },

  processPayout: async (cleanerId, amount) => {
    const response = await api.post('/admin/payments/process-payout', {
      cleanerId,
      amount
    });
    return response.data;
  },

  getDisputes: async (params = {}) => {
    const response = await api.get('/admin/payments/disputes', { params });
    return response.data;
  },

  resolveDispute: async (disputeId, resolution) => {
    const response = await api.post(`/admin/payments/disputes/${disputeId}/resolve`, {
      resolution
    });
    return response.data;
  },

  getPaymentStats: async (dateRange) => {
    const response = await api.get('/admin/payments/stats', { params: dateRange });
    return response.data;
  },

  refundPayment: async (paymentId, reason) => {
    const response = await api.post(`/admin/payments/${paymentId}/refund`, { reason });
    return response.data;
  }
};