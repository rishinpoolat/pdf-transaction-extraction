import axios from 'axios';
import { refreshTokenAction } from '@/app/actions/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance for client-side requests
// Using cookie-based authentication
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Response interceptor - Handle 401 errors with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh on login/logout endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      try {
        // Call server action to refresh token
        // If refresh fails, it will redirect to /login via redirect()
        const result = await refreshTokenAction();

        if (result.success) {
          // Token refreshed successfully, retry the original request
          // Cookies are already updated on the server and will be sent automatically
          return axiosInstance(originalRequest);
        }

        // This shouldn't be reached because refreshTokenAction redirects on failure
        return Promise.reject(error);
      } catch (refreshError) {
        // Server action threw redirect, which causes a NEXT_REDIRECT error
        // This is expected behavior - the redirect is happening
        const errorMessage = String(refreshError);

        if (errorMessage.includes('NEXT_REDIRECT')) {
          // This is expected - redirect to /login is happening
          // Let Next.js handle the redirect
          return Promise.reject(error);
        }

        // Unexpected error
        console.error('Unexpected refresh error:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
