import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for HTTP-Only cookies (refresh token)
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;

      try {
        // Attempt silent refresh
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        if (data.success && data.data?.accessToken) {
          const newToken = data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          
          // Update authorization header for the retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token expired or invalid, log out user
        console.error('Refresh token failed. Redirecting to login...', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Clean redirection to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// We use module.exports for consistency if node scripts require it, but we can also use standard ESM export:
// Let's use ESM exports for Vue 3 client files!
export default api;
