import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance for client-side requests
// Now using cookie-based authentication instead of localStorage
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Response interceptor - Handle 401 errors by redirecting to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If error is 401, the user's session has expired
    if (error.response?.status === 401) {
      // Only redirect to login if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
