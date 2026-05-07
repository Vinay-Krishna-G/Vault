import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  if (url.endsWith('/api')) return url;
  return `${url.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyvault_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
