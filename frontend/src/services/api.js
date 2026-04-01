import axios from 'axios';

const rawBaseUrl = 'http://localhost:5000';
const API_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
const AUTH_USER_UPDATED_EVENT = 'auth-user-updated';
const AUTH_INVALIDATION_MESSAGES = new Set([
  'User not found',
  'Invalid token',
  'Token expired',
  'No token provided',
  'Unauthorized',
]);

const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.dispatchEvent(new Event(AUTH_USER_UPDATED_EVENT));
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const token = savedUser?.token || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore malformed local storage payloads
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Number(error?.response?.status || 0);
    const message = String(error?.response?.data?.message || '').trim();

    if (status === 401 || AUTH_INVALIDATION_MESSAGES.has(message)) {
      clearStoredAuth();
    }

    return Promise.reject(error);
  }
);

export default api;
