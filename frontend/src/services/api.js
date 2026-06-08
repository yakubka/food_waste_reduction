import axios from 'axios';
import { useAuthStore } from './authStore';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err.response?.data?.error || 'Request failed');
  }
);

export const wasteApi = {
  getLogs:    (params) => api.get('/waste', { params }),
  logWaste:   (data)   => api.post('/waste', data),
  getDailySummary: (cafeteria_id) => api.get('/waste/summary/daily', { params: { cafeteria_id } }),
};

export const analyticsApi = {
  getOverview:  (cafeteria_id) => api.get('/analytics/overview',  { params: { cafeteria_id } }),
  getForecast:  ()             => api.get('/analytics/demand-forecast'),
  getReduction: ()             => api.get('/analytics/reduction'),
};

export const mealsApi = {
  list:      (params) => api.get('/meals', { params }),
  create:    (data)   => api.post('/meals', data),
  wasteTrend:(id)     => api.get(`/meals/${id}/waste-trend`),
};

export const alertsApi = {
  list:    (cafeteria_id) => api.get('/alerts', { params: { cafeteria_id } }),
  markRead:(id, cafeteria_id) => api.patch(`/alerts/${id}/read`, null, { params: { cafeteria_id } }),
};

export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export default api;
