import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token automatisch an jeden Request anhängen
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globale Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Ein unbekannter Fehler ist aufgetreten';

    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    window.dispatchEvent(
      new CustomEvent('app:error', { detail: { message } })
    );

    return Promise.reject(error);
  }
);

// --- Auth ---
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// --- Products ---
export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);

// ── Admin: Produkte ───────────────────────────────────────────────────────

export const adminGetProducts = () =>
  api.get('/admin/products');

export const adminCreateProduct = (data) =>
  api.post('/admin/products', data);

export const adminUpdateProduct = (id, data) =>
  api.put(`/admin/products/${id}`, data);

export const adminDeleteProduct = (id) =>
  api.delete(`/admin/products/${id}`);

// ── Admin: Bestellungen ───────────────────────────────────────────────────

export const adminGetOrders = () =>
  api.get('/admin/orders');

export const adminUpdateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status });

export default api;

