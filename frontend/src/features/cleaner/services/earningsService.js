import api from '../../../services/api';

export const fetchCleanerEarnings = async () => {
  const response = await api.get('/dashboard/cleaner/earnings');
  return response.data?.data || {};
};

export const fetchCleanerEarningsSummary = async () => {
  const response = await api.get('/dashboard/cleaner/earnings/summary');
  return response.data?.data || [];
};
