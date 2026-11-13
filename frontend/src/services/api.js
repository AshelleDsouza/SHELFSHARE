import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // Enables HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
