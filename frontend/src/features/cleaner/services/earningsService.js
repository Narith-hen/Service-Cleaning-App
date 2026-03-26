import api from '../../../services/api';

export const fetchCleanerEarnings = async (params) => {
  const response = await api.get('/dashboard/cleaner/earnings', {
    params
  });
  return response.data?.data || {};
};

export const fetchCleanerEarningsSummary = async (params) => {
  const response = await api.get('/dashboard/cleaner/earnings/summary', {
    params
  });
  return response.data?.data || [];
};
