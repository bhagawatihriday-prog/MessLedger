import axios from 'axios';

// Determine if running in mock mode
export const isMockMode = import.meta.env.VITE_USE_MOCK !== 'false';

// Base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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

// Response interceptor: handle 401 and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('messledger_token');
      localStorage.removeItem('messledger_user');
      if (window.location.pathname.startsWith('/login/dashboard')) {
        window.location.href = '/login?session_expired=true';
      }
    }

    const message =
      error.response?.data?.message ||
      (error.message === 'Network Error'
        ? 'Unable to connect to the MessLedger server. Please verify that the backend server is running on port 5000.'
        : error.message || 'An unexpected error occurred. Please try again.');

    const customError = new Error(message);
    customError.response = error.response;
    customError.status = error.response?.status;
    customError.isRosterRestricted = Boolean(
      error.response?.data?.isRosterRestricted || error.response?.status === 403
    );
    customError.email = error.response?.data?.email || null;
    return Promise.reject(customError);
  }
);

// Helper for mock network latency simulation
export const simulateDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default api;
