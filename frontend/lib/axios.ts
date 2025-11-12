import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept login requests - let the login page handle those errors
    if (originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        const currentPath = window.location.pathname;

        // Don't redirect if already on login page
        if (currentPath === '/login') {
          return Promise.reject(error);
        }

        if (refreshToken) {
          try {
            // Try to refresh the access token
            const response = await axios.post(
              `${API_URL}/auth/refresh-token`,
              { refreshToken }
            );

            const { accessToken } = response.data.data;

            // Update stored access token
            localStorage.setItem('accessToken', accessToken);

            // Update the failed request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // Retry the original request
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear storage and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }

            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token available - redirect to login only if not already there
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
