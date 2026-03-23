import api from '../../../services/api';

export const cleanerService = {
  getCleaners: async (params = {}) => {
    const response = await api.get('/admin/cleaners', { params });
    return response.data;
  },

  createCleaner: async (payload) => {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (key === 'profileFile') {
        formData.append('avatar', value);
        return;
      }
      if (key === 'profileImage') {
        return;
      }
      formData.append(key, value);
    });

    const response = await api.post('/admin/cleaners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateCleaner: async (cleanerId, payload) => {
    const formData = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (key === 'profileFile') {
        formData.append('avatar', value);
        return;
      }
      if (key === 'profileImage') {
        return;
      }
      formData.append(key, value);
    });

    const response = await api.put(`/admin/cleaners/${cleanerId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteCleaner: async (cleanerId) => {
    const response = await api.delete(`/admin/cleaners/${cleanerId}`);
    return response.data;
  },

  getCleanerById: async (cleanerId) => {
    const response = await api.get(`/admin/cleaners/${cleanerId}`);
    return response.data;
  },

  verifyCleaner: async (cleanerId, documents) => {
    const response = await api.post(`/admin/cleaners/${cleanerId}/verify`, documents);
    return response.data;
  },

  updateCleanerStatus: async (cleanerId, status) => {
    const response = await api.patch(`/admin/cleaners/${cleanerId}/status`, { status });
    return response.data;
  },

  getCleanerEarnings: async (cleanerId, dateRange) => {
    const response = await api.get(`/admin/cleaners/${cleanerId}/earnings`, {
      params: dateRange
    });
    return response.data;
  },

  getCleanerReviews: async (cleanerId, page = 1) => {
    const response = await api.get(`/admin/cleaners/${cleanerId}/reviews`, {
      params: { page }
    });
    return response.data;
  },

  getCleanerSchedule: async (cleanerId, date) => {
    const response = await api.get(`/admin/cleaners/${cleanerId}/schedule`, {
      params: { date }
    });
    return response.data;
  },

  updateCleanerCommission: async (cleanerId, commissionRate) => {
    const response = await api.patch(`/admin/cleaners/${cleanerId}/commission`, {
      commissionRate
    });
    return response.data;
  }
};
