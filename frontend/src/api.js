import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

export const chatAPI = {
  sendMessage: (payload) => api.post('/chat', payload),
};

export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getOne: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  delete: (id) => api.delete(`/sessions/${id}`),
};
