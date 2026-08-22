import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api`;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT Bearer token and role headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codesentinel_jwt');
  const role = localStorage.getItem('codesentinel_role') || 'ADMIN';
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-api-key'] = 'cs_live_devsecops_key_enterprise_2026';
  config.headers['x-codesentinel-role'] = role;
  return config;
});

// Auth endpoints
export const loginApi = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const demoLoginApi = async (role) => {
  const res = await api.post('/auth/demo-login', { role });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Metrics & Stats
export const getMetrics = async () => {
  const res = await api.get('/metrics');
  return res.data?.data;
};

export const getPublicStats = async () => {
  const res = await api.get('/metrics/public');
  return res.data?.data;
};

// Reviews & Scans
export const getReviews = async (params = {}) => {
  const res = await api.get('/reviews', { params });
  return res.data;
};

export const getReviewById = async (id) => {
  const res = await api.get(`/reviews/${id}`);
  return res.data?.data;
};

export const analyzeManualDiff = async (payload) => {
  const res = await api.post('/reviews/analyze-manual', payload);
  return res.data?.data;
};

export const replaySampleScan = async (payload = {}) => {
  const res = await api.post('/reviews/replay-sample', payload);
  return res.data;
};

export const getAuditLogs = async (params = {}) => {
  const res = await api.get('/audit', { params });
  return res.data?.data;
};

export const triggerSimulatedWebhook = async (payload) => {
  const res = await api.post('/webhooks/github', payload, {
    headers: {
      'x-github-event': 'pull_request',
      'x-codesentinel-simulation': 'true'
    }
  });
  return res.data;
};

export default api;
