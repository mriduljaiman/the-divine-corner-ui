// ============ services/api.js ============
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Don't redirect for auth check endpoints - 401 is expected for unauthenticated users
      const isAuthCheck = requestUrl.includes('/users/profile') || requestUrl.includes('/auth/');
      if (typeof window !== 'undefined' && !isAuthCheck) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;