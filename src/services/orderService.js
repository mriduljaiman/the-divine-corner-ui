// ============ services/orderService.js ============
import api from './api';

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (page = 0, size = 10) => api.get(`/orders?page=${page}&size=${size}`),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: (page = 0, size = 10) => api.get(`/admin/orders?page=${page}&size=${size}`),
  getOrderByIdAdmin: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};