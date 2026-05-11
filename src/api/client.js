/**
 * Sanos y Salvos â€” API Client
 * HTTP client with JWT interceptor for authenticated requests.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor â€” attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor â€” handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', res.data.access_token);
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Pets / Reports
export const petsAPI = {
  getReports: (params) => api.get('/pets/reports', { params }),
  getReport: (id) => api.get(`/pets/reports/${id}`),
  createReport: (data) => api.post('/pets/reports', data),
  getMyReports: () => api.get('/pets/my-reports'),
  updateStatus: (id, status) => api.patch(`/pets/reports/${id}/status`, { status }),
  getStats: () => api.get('/pets/stats'),
};

// Geolocation
export const geoAPI = {
  getReports: () => api.get('/geo/reports'),
  getNearby: (lat, lng, radius) => api.get('/geo/nearby', { params: { lat, lng, radius } }),
  getHeatmap: () => api.get('/geo/heatmap'),
  getZones: () => api.get('/geo/zones'),
  createLocation: (data) => api.post('/geo/locations', data),
};

// Matches
export const matchesAPI = {
  getAll: () => api.get('/matches/'),
  getById: (id) => api.get(`/matches/${id}`),
  getByReport: (reportId) => api.get(`/matches/report/${reportId}`),
  updateStatus: (id, status) => api.patch(`/matches/${id}/status`, { status }),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

export default api;

