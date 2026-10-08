import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

let activeOrgId: string | null = null;

export function setActiveOrgId(id: string | null) {
  activeOrgId = id;
}

apiClient.interceptors.request.use((config) => {
  if (activeOrgId) {
    config.headers['X-Org-Id'] = activeOrgId;
  }
  return config;
});
