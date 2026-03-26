import api from '../../../services/api';

export const bookingService = {
  getBookings: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },

  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  updateBookingStatus: async (bookingId, status) => {
    const payload = typeof status === 'object' && status !== null
      ? status
      : { booking_status: status };
    const response = await api.patch(`/bookings/${bookingId}/status`, payload);
    return response.data;
  },

  cancelBooking: async (bookingId, reason) => {
    const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },

  assignCleaner: async (bookingId, cleanerId) => {
    const response = await api.post(`/admin/bookings/${bookingId}/assign`, { cleaner_id: cleanerId });
    return response.data;
  },

  rescheduleBooking: async (bookingId, newDateTime) => {
    const response = await api.post(`/admin/bookings/${bookingId}/reschedule`, {
      newDateTime
    });
    return response.data;
  },

  getBookingStats: async (dateRange) => {
    const response = await api.get('/admin/bookings/stats', { params: dateRange });
    return response.data;
  },

  getBookingHistory: async (bookingId) => {
    const response = await api.get(`/bookings/history/${bookingId}`);
    return response.data;
  }
};
