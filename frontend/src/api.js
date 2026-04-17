import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

/* ── Auth interceptor: attach JWT to every request ─────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Auth API ──────────────────────────────────────────────── */
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

/* ── Chat API ──────────────────────────────────────────────── */
export const chatAPI = {
  sendMessage: (payload) => api.post('/chat', payload),
};

/* ── Sessions API ──────────────────────────────────────────── */
export const sessionsAPI = {
  getAll: ()     => api.get('/sessions'),
  getOne: (id)   => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  delete: (id)   => api.delete(`/sessions/${id}`),
};
