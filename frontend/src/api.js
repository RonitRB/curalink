import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120_000, // 2 minute timeout (research pipeline can be slow)
});

// ── Token management ──────────────────────────────────────────
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization'];
}

// ── Request interceptor: ensure security headers ────────
api.interceptors.request.use(
  (config) => {
    // Always add X-Requested-With to identify AJAX requests (CSRF-like protection)
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: auto-logout on 401 ──────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthToken();
      // Dispatch event so AuthContext can sign out from Supabase
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

// ── Chat API ──────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (payload) => api.post('/chat', payload),
  summarize: (payload) => api.post('/chat/summarize', payload),
};

// ── Sessions API ──────────────────────────────────────────────
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getOne: (id) => api.get(`/sessions/${encodeURIComponent(id)}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${encodeURIComponent(id)}`, data),
  delete: (id) => api.delete(`/sessions/${encodeURIComponent(id)}`),
  getStats: () => api.get('/sessions/stats/overview'),
  share: (id) => api.post(`/sessions/${encodeURIComponent(id)}/share`),
  unshare: (id) => api.delete(`/sessions/${encodeURIComponent(id)}/share`),
  getShared: (token) => api.get(`/sessions/shared/${encodeURIComponent(token)}`),
};

// ── Bookmarks API ─────────────────────────────────────────────
export const bookmarksAPI = {
  getAll: () => api.get('/bookmarks'),
  create: (data) => api.post('/bookmarks', data),
  delete: (id) => api.delete(`/bookmarks/${encodeURIComponent(id)}`),
};

// ── Alerts API ────────────────────────────────────────────────
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  delete: (id) => api.delete(`/alerts/${encodeURIComponent(id)}`),
  toggle: (id, isActive) => api.patch(`/alerts/${encodeURIComponent(id)}`, { is_active: isActive }),
};

export default api;
