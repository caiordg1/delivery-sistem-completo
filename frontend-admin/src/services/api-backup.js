import axios from 'axios';

console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para injetar token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funções de Cupons
api.getCoupons = (params) => api.get('/api/coupons', { params });
api.createCoupon = (data) => api.post('/api/coupons', data);
api.getCoupon = (id) => api.get(`/api/coupons/${id}`);
api.updateCoupon = (id, data) => api.patch(`/api/coupons/${id}`, data);
api.deleteCoupon = (id) => api.delete(`/api/coupons/${id}`);
api.validateCoupon = (data) => api.post('/api/coupons/validate', data);
api.applyCoupon = (data) => api.post('/api/coupons/apply', data);
api.getCouponUsage = (id) => api.get(`/api/coupons/${id}/usage`);

// Funções de Fidelidade
api.getLoyaltyLevels = () => api.get('/api/loyalty/info/levels');
api.getLoyaltyUser = (userId) => api.get(`/api/loyalty/${userId}`);
api.addLoyaltyPoints = (data) => api.post('/api/loyalty/add-points', data);

// Funções de Produtos/Menu - ATUALIZADAS PARA /products
api.getProducts = () => api.get('/api/products');
api.getProduct = (id) => api.get(`/api/products/${id}`);
api.createProduct = (data) => api.post('/api/products', data);
api.updateProduct = (id, data) => api.patch(`/api/products/${id}`, data);
api.deleteProduct = (id) => api.delete(`/api/products/${id}`);
api.uploadProductImage = (formData) => api.post('/api/upload/product', formData);

// Funções de usuários/clientes
api.getUsers = () => api.get('/api/users');
api.createUser = (data) => api.post('/api/users', data);
api.updateUser = (id, data) => api.patch(`/api/users/${id}`, data);
api.deleteUser = (id) => api.delete(`/api/users/${id}`);
api.getUserOrders = (id) => api.get(`/api/users/${id}/orders`);

// Funções de Pedidos - ADICIONADAS
api.getOrders = () => api.get('/api/orders');
api.getOrder = (id) => api.get(`/api/orders/${id}`);
api.createOrder = (data) => api.post('/api/orders', data);
api.updateOrder = (id, data) => api.patch(`/api/orders/${id}`, data);
api.deleteOrder = (id) => api.delete(`/api/orders/${id}`);

// =====================================
// 🆕 FUNÇÕES KANBAN - COMPATÍVEIS
// =====================================

// Dados agrupados para Kanban
api.getKanbanData = () => api.get('/api/orders/kanban/data');

// Atualização de status avançada
api.updateOrderStatus = (orderId, statusData) => api.patch(`/api/orders/${orderId}/status`, statusData);

// Sistema de observações
api.getOrderObservations = (orderId) => api.get(`/api/orders/${orderId}/observations`);
api.addOrderObservation = (orderId, observationData) => api.post(`/api/orders/${orderId}/observations`, observationData);

// Histórico do pedido
api.getOrderHistory = (orderId) => api.get(`/api/orders/${orderId}/history`);

// Métricas operacionais
api.getOrderMetrics = () => api.get('/api/orders/metrics/dashboard');

// Sistema de alertas
api.getOrderAlerts = () => api.get('/api/orders/alerts');
export default api;
