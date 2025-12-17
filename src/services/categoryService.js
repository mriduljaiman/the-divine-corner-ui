// ============ services/categoryService.js ============
import api from './api';

export const categoryService = {
  getAllActiveCategories: () => api.get('/categories'),
  getAllCategories: (page = 0, size = 10) => api.get(`/categories/all?page=${page}&size=${size}`),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};