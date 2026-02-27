import api from '../../../services/api';

export const adminService = {
  // Dashboard
  getDashboardStats: async (dateRange) => {
    const response = await api.get('/admin/dashboard/stats', {
      params: { range: dateRange }
    });
    return response.data;
  },

  getRecentBookings: async (limit = 10) => {
    const response = await api.get('/admin/dashboard/recent-bookings', {
      params: { limit }
    });
    return response.data;
  },

  getRevenueChart: async (dateRange) => {
    const response = await api.get('/admin/dashboard/revenue-chart', {
      params: { range: dateRange }
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (filters) => {
    const response = await api.get('/admin/analytics', { params: filters });
    return response.data;
  },

  // Reports
  generateReport: async (reportType, filters) => {
    const response = await api.post('/admin/reports/generate', {
      type: reportType,
      filters
    });
    return response.data;
  },

  exportData: async (dataType, format, filters) => {
    const response = await api.get(`/admin/export/${dataType}`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }
};