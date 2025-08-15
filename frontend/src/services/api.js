import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Dashboard services
export const dashboardService = {
  getMetrics: (params) => api.get('/dashboard/metrics', { params }),
};

// Admin services
export const adminService = {
  getAdminDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserMetrics: (id, params) => api.get(`/admin/users/${id}/metrics`, { params }),
  getTenants: () => api.get('/admin/tenants'),
};

// Payment services
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Expense services
export const expenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Attendant services
export const attendantService = {
  getAll: (params) => api.get('/attendants', { params }),
  create: (data) => api.post('/attendants', data),
  update: (id, data) => api.put(`/attendants/${id}`, data),
  delete: (id) => api.delete(`/attendants/${id}`),
};

// Tripeiro services
export const tripeiroService = {
  getAll: (params) => api.get('/tripeiros', { params }),
  create: (data) => api.post('/tripeiros', data),
  update: (id, data) => api.put(`/tripeiros/${id}`, data),
  delete: (id) => api.delete(`/tripeiros/${id}`),
};

// Note services
export const noteService = {
  getAll: (params) => api.get('/notes', { params }),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Reminder services
export const reminderService = {
  getAll: (params) => api.get('/reminders', { params }),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
};

export default api;