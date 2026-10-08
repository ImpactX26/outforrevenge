import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests and inject token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Intercept responses and handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/otp') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('nexora_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          if (res.data.success && res.data.accessToken) {
            localStorage.setItem('nexora_token', res.data.accessToken);
            localStorage.setItem('nexora_refresh_token', res.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (e) {
          localStorage.removeItem('nexora_token');
          localStorage.removeItem('nexora_refresh_token');
          localStorage.removeItem('nexora_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
