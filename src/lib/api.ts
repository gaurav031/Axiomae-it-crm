import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_TARGET?.replace(/\/+$/, '') || '') + '/api',
  withCredentials: true, // important if using cookies for auth
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling, e.g., redirect to login on 401
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
