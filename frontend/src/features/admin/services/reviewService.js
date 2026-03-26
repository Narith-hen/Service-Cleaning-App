import api from '../../../services/api';

export const reviewService = {
  getReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },

  getReviewStats: async () => {
    const response = await api.get('/admin/reviews/stats');
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  }
};
