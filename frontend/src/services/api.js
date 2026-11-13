import axios from 'axios';

/**
 * Normalizes the API Base URL to ensure it always points to the backend /api prefix
 * regardless of whether the user sets:
 * - https://example.vercel.app
 * - https://example.vercel.app/
 * - https://example.vercel.app/api
 * - https://example.vercel.app/api/
 */
function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.trim() === '') {
    return '/api';
  }

  let cleaned = envUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Enables cross-site HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer token from localStorage as fallback
// This ensures reliable authentication even if cross-site cookies are blocked by browser settings
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shelfshare_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract human-readable error messages and handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If session expired or unauthorized, clear token from localStorage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('shelfshare_token');
    }

    let errorMessage = 'An unexpected network error occurred. Please check your connection.';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
