// ============ services/adminService.js ============
import api from './api';

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const adminService = {
  analytics: () => api.get('/admin/analytics'),
  legacyDashboard: () => api.get('/admin/dashboard'),

  // counter billing
  createBill: (data) => api.post('/admin/pos/bills', data),
  bills: (params) => api.get(`/admin/pos/bills${qs(params)}`),
  bill: (id) => api.get(`/admin/pos/bills/${id}`),
  recordPayment: (id, data) => api.post(`/admin/pos/bills/${id}/payments`, data),
  voidBill: (id, reason) => api.post(`/admin/pos/bills/${id}/void`, { reason }),
  dues: () => api.get('/admin/pos/dues'),
  manualDue: (data) => api.post('/admin/pos/dues/manual', data),
  billDiscount: (billId, amount, note) => api.post(`/admin/pos/bills/${billId}/discount`, { amount, note: note || null }),
  setDueDate: (billId, dueDate) => api.put(`/admin/pos/bills/${billId}/due-date`, { dueDate: dueDate || null }),
  ledger: (phone) => api.get(`/admin/pos/customers/${encodeURIComponent(phone)}/ledger`),
  markReminded: (phone) => api.post(`/admin/pos/customers/${encodeURIComponent(phone)}/reminded`),
  customerBills: (phone) => api.get(`/admin/pos/customers/${encodeURIComponent(phone)}/bills`),
  collectFromCustomer: (phone, data) => api.post(`/admin/pos/customers/${encodeURIComponent(phone)}/payments`, data),

  // expenses
  expenses: (params) => api.get(`/admin/expenses${qs(params)}`),
  createExpense: (data) => api.post('/admin/expenses', data),
  updateExpense: (id, data) => api.put(`/admin/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/admin/expenses/${id}`),

  // customers
  users: (page = 0, size = 50) => api.get(`/admin/users?page=${page}&size=${size}`),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-status`),

  // products
  lookup: (code) => api.get(`/products/lookup/${encodeURIComponent(code)}`),
  searchProducts: (params) => api.get(`/products/search${qs(params)}`),
  categories: () => api.get('/categories'),
};
