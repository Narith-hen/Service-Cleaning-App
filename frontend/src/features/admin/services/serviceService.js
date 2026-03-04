import api from '../../../services/api';

export const serviceService = {
  getServices: async (params = {}) => {
    const response = await api.get('/admin/services', { params });
    return response.data;
  },

  getServiceById: async (serviceId) => {
    const response = await api.get(`/admin/services/${serviceId}`);
    return response.data;
  },

  createService: async (payload) => {
    const response = await api.post('/admin/services', payload);
    return response.data;
  },

  updateService: async (serviceId, payload) => {
    const response = await api.put(`/admin/services/${serviceId}`, payload);
    return response.data;
  },

  uploadServiceImage: async (serviceId, file) => {
    const formData = new FormData();
    formData.append('images', file);
    const response = await api.post(`/admin/services/${serviceId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await api.delete(`/admin/services/${serviceId}`);
    return response.data;
  }
};

export default serviceService;
