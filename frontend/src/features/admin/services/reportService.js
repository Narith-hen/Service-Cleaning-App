import api from '../../../services/api';

export const reportService = {
  getRevenueReport: async (filters) => {
    const response = await api.get('/admin/reports/revenue', { params: filters });
    return response.data;
  },

  getUserReport: async (filters) => {
    const response = await api.get('/admin/reports/users', { params: filters });
    return response.data;
  },

  getCleanerPerformanceReport: async (filters) => {
    const response = await api.get('/admin/reports/cleaner-performance', { params: filters });
    return response.data;
  },

  getBookingReport: async (filters) => {
    const response = await api.get('/admin/reports/bookings', { params: filters });
    return response.data;
  },

  exportReport: async (reportType, format, filters) => {
    const response = await api.get(`/admin/reports/export/${reportType}`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  },

  scheduleReport: async (reportConfig) => {
    const response = await api.post('/admin/reports/schedule', reportConfig);
    return response.data;
  },

  getScheduledReports: async () => {
    const response = await api.get('/admin/reports/scheduled');
    return response.data;
  }
};