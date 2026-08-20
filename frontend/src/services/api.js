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

// Attach API Key or Auth Token if available
api.interceptors.request.use((config) => {
  const role = localStorage.getItem('codesentinel_role') || 'ADMIN';
  config.headers['x-api-key'] = 'cs_live_devsecops_key_enterprise_2026';
  config.headers['x-codesentinel-role'] = role;
  return config;
});

export const getMetrics = async () => {
  const res = await api.get('/metrics');
  return res.data?.data;
};

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
