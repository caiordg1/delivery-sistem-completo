import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ TODAS AS FUNÇÕES EXISTENTES PRESERVADAS
// Cupons
api.createCoupon = (data) => api.post('/api/coupons', data);
api.getCoupons = () => api.get('/api/coupons');
api.getCoupon = (id) => api.get(`/api/coupons/${id}`);
api.updateCoupon = (id, data) => api.patch(`/api/coupons/${id}`, data);
api.deleteCoupon = (id) => api.delete(`/api/coupons/${id}`);
api.validateCoupon = (code) => api.post('/api/coupons/validate', { code });
api.getCouponUsage = (id) => api.get(`/api/coupons/${id}/usage`);
api.toggleCouponStatus = (id) => api.patch(`/api/coupons/${id}/toggle`);

// Fidelidade
api.getLoyaltyLevels = () => api.get('/api/loyalty/levels');
api.getUserLoyalty = (userId) => api.get(`/api/loyalty/user/${userId}`);
api.addLoyaltyPoints = (data) => api.post('/api/loyalty/add-points', data);

// Produtos
api.getProducts = () => api.get('/api/products');
api.createProduct = (data) => api.post('/api/products', data);
api.getProduct = (id) => api.get(`/api/products/${id}`);
api.updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
api.deleteProduct = (id) => api.delete(`/api/products/${id}`);
api.uploadProductImage = (id, formData) => api.post(`/api/products/${id}/upload`, formData);

// Usuários
api.getUsers = () => api.get('/api/users');
api.createUser = (data) => api.post('/api/users', data);
api.getUser = (id) => api.get(`/api/users/${id}`);
api.updateUser = (id, data) => api.patch(`/api/users/${id}`, data);
api.deleteUser = (id) => api.delete(`/api/users/${id}`);

// Pedidos básicos
api.getOrders = () => api.get('/api/orders');
api.getOrder = (id) => api.get(`/api/orders/${id}`);
api.createOrder = (data) => api.post('/api/orders', data);
api.updateOrder = (id, data) => api.patch(`/api/orders/${id}`, data);
api.deleteOrder = (id) => api.delete(`/api/orders/${id}`);

// 🆕 NOVA FUNÇÃO - Buscar pedidos por telefone do cliente
api.getOrdersByPhone = (phone) => api.get(`/api/orders/by-phone/${phone}`);

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
