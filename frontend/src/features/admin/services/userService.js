import api from '../../../services/api';

export const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  bulkUpdateStatus: async (userIds, status) => {
    const response = await api.post('/admin/users/bulk/status', { userIds, status });
    return response.data;
  },

  bulkDeleteUsers: async (userIds) => {
    const response = await api.post('/admin/users/bulk/delete', { userIds });
    return response.data;
  },

  getUserActivity: async (userId, dateRange) => {
    const response = await api.get(`/admin/users/${userId}/activity`, {
      params: dateRange
    });
    return response.data;
  }
};