// FILE: client/src/services/api.js
// Uses relative baseURL so it works through Vite proxy for both
// localhost AND VS Code tunnel / ngrok / any remote URL.
// The proxy in vite.config.js forwards /api → localhost:5000
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',          // relative — goes through Vite proxy
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = window.__aura_access_token__;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else       prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── If offline or no HTTP response (network failure), never attempt
    // a token refresh or redirect — just reject silently so callers' .catch()
    // can handle it without kicking the user to /auth
    if (!navigator.onLine || !error.response) {
      return Promise.reject(error);
    }

    const shouldIntercept =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      window.location.pathname !== '/auth/callback';

    if (!shouldIntercept) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = window.__aura_refresh_token__;
      const res = await api.post('/auth/refresh',
        refreshToken ? { refreshToken } : {}
      );
      const newToken = res.data.data?.accessToken || res.data.accessToken;
      window.__aura_access_token__ = newToken;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Only clear tokens + redirect on a real server auth failure,
      // not a network error while offline
      if (navigator.onLine && refreshError.response) {
        window.__aura_access_token__  = null;
        window.__aura_refresh_token__ = null;
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth';
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;