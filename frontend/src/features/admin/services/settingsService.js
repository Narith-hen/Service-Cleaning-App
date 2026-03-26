import api from '../../../services/api';

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  updateSettings: async (payload) => {
    const response = await api.put('/users/settings', payload);
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await api.post('/users/change-password', payload);
    return response.data;
  }
};
