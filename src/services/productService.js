// ============ services/productService.js ============
import api from './api';

export const productService = {
  getAllProducts: (page = 0, size = 12, sortBy = 'createdAt', sortDir = 'DESC') =>
    api.get(`/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
  
  searchProducts: (filters) => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    params.append('page', filters.page || 0);
    params.append('size', filters.size || 12);
    return api.get(`/products/search?${params.toString()}`);
  },
  
  getFeaturedProducts: () => api.get('/products/featured'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};