// ============ services/dashboardService.js ============
import api from './api';

export const dashboardService = {
  getDashboard: () => api.get('/admin/dashboard'),
};