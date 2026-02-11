import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

function clearAuthAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // Coalesce concurrent refresh attempts into a single request
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', { refresh_token: refreshToken })
          .then((res) => {
            const newToken: string = res.data.access_token;
            localStorage.setItem('access_token', newToken);
            return newToken;
          })
          .catch(() => {
            clearAuthAndRedirect();
            return '';
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (!newToken) return Promise.reject(error);

      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    }
    return Promise.reject(error);
  }
);

export default client;
