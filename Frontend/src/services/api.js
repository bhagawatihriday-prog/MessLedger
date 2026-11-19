import axios from 'axios';

// Determine if running in mock mode
export const isMockMode = import.meta.env.VITE_USE_MOCK !== 'false';

// Normalize API base URL to guarantee /api suffix
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
};

// Base Axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('messledger_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Queue and lock to handle simultaneous requests during silent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthStorageAndRedirect = () => {
  localStorage.removeItem('messledger_token');
  localStorage.removeItem('messledger_refresh_token');
  localStorage.removeItem('messledger_user');
  if (
    window.location.pathname.startsWith('/login/dashboard') ||
    window.location.pathname.startsWith('/admin')
  ) {
    window.location.href = '/login?session_expired=true';
  }
};

const formatCustomError = (error) => {
  const message =
    error.response?.data?.message ||
    (error.message === 'Network Error'
      ? 'Unable to connect to the MessLedger server. Please verify that the backend server is running on port 5000.'
      : error.message || 'An unexpected error occurred. Please try again.');

  const customError = new Error(message);
  customError.response = error.response;
  customError.status = error.response?.status;
  customError.code = error.response?.data?.code || null;
  customError.isRosterRestricted = Boolean(
    error.response?.data?.isRosterRestricted || error.response?.status === 403
  );
  customError.email = error.response?.data?.email || null;
  return customError;
};

// Response interceptor: handle 401 with silent token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh if 401 came from auth action endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/google') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(formatCustomError(error));
      }

      const refreshToken = localStorage.getItem('messledger_refresh_token');

      // If no refresh token exists, immediately redirect to login
      if (!refreshToken) {
        clearAuthStorageAndRedirect();
        return Promise.reject(formatCustomError(error));
      }

      if (isRefreshing) {
        // Queue parallel requests while refresh is in flight
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
        // Direct unintercepted axios call to prevent circular refresh calls
        const refreshRes = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data?.accessToken || refreshRes.data?.token;
        const newRefreshToken = refreshRes.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('messledger_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('messledger_refresh_token', newRefreshToken);
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error('Refresh response missing token.');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthStorageAndRedirect();
        return Promise.reject(formatCustomError(refreshErr));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatCustomError(error));
  }
);

// Helper for mock network latency simulation
export const simulateDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default api;
