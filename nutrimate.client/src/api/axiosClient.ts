import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach CSRF token from store to every mutating request
api.interceptors.request.use((config) => {
  const { csrfToken } = useAuthStore.getState();
  if (csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
    config.headers['X-Csrf-Token'] = csrfToken;
  }
  return config;
});

// On 401, try to refresh; on failure, clear auth state
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) =>
          refreshQueue.push((csrfToken) => {
            originalRequest.headers['X-Csrf-Token'] = csrfToken;
            resolve(api(originalRequest));
          })
        );
      }

      isRefreshing = true;
      try {
        const { data } = await axios.get('/api/auth/refresh', { withCredentials: true });
        const { csrfToken, user } = data;
        useAuthStore.getState().setAuth(user, csrfToken);
        refreshQueue.forEach((cb) => cb(csrfToken));
        refreshQueue = [];
        originalRequest.headers['X-Csrf-Token'] = csrfToken;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
