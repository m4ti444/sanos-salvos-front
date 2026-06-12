import axios from 'axios';
import { firebaseAuth } from '../lib/firebase';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const currentUser = firebaseAuth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth is handled by Firebase SDK directly.
export const authAPI = {};

export const petsAPI = {
  getReports: (params) => api.get('/pets/reports', { params }),
  getReport: (id) => api.get(`/pets/reports/${id}`),
  createReport: (data) => api.post('/pets/reports', data),
  getMyReports: () => api.get('/pets/my-reports'),
  getMyReportsSummary: () => api.get('/pets/my-reports/summary'),
  updateStatus: (id, status) => api.patch(`/pets/reports/${id}/status`, { status }),
  deleteReport: (id) => api.delete(`/pets/reports/${id}`),
  getStats: () => api.get('/pets/stats'),
};

export const geoAPI = {
  getReports: () => api.get('/geo/reports'),
  getNearby: (lat, lng, radius) => api.get('/geo/nearby', { params: { lat, lng, radius } }),
  getHeatmap: () => api.get('/geo/heatmap'),
  getZones: () => api.get('/geo/zones'),
  createLocation: (data) => api.post('/geo/locations', data),
};

export const matchesAPI = {
  getAll: () => api.get('/matches/'),
  getById: (id) => api.get(`/matches/${id}`),
  getByReport: (reportId) => api.get(`/matches/report/${reportId}`),
  updateStatus: (id, status) => api.patch(`/matches/${id}/status`, { status }),
};

export const notificationsAPI = {
  getAll: (userId) => api.get('/notifications/', { params: userId ? { user_id: userId } : {} }),
  getUnreadCount: (userId) => api.get('/notifications/unread-count', { params: userId ? { user_id: userId } : {} }),
  markRead: (id, userId) => api.patch(`/notifications/${id}/read`, null, { params: userId ? { user_id: userId } : {} }),
};

export default api;
