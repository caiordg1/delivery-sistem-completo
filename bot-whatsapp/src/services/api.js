// src/services/api.js
require('dotenv').config();
const axios = require('axios');
const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
  timeout: 5000                     // 5 s de timeout
});
/* ──────────────────────────────────────────────────────
   Se existir BOT_JWT no .env, envia em todas as requisições
   ────────────────────────────────────────────────────── */
if (process.env.BOT_JWT) {
  api.defaults.headers.common.Authorization = `Bearer ${process.env.BOT_JWT}`;
}
/**
 * Busca todos os produtos do cardápio
 * Retorna um array de objetos: [{ name, price, ... }]
 */
async function fetchMenu() {
  const res = await api.get('/api/menu');
  return res.data;        // ajuste se seu endpoint retornar outro formato
}
/**
 * Cria um pedido no backend
 * @param {Object} payload { customerName, items: [ { productId, qty } ] }
 * Retorna o objeto criado (inclui _id)
 */
async function createOrder(payload) {
  // 🆕 ADICIONANDO SOURCE WHATSAPP AUTOMATICAMENTE
  const orderData = { 
    ...payload, 
    source: 'whatsapp' 
  };
  
  const res = await api.post('/api/orders', orderData);
  return res.data;
}
/**
 * 🆕 NOVA FUNÇÃO: Busca pedidos de um cliente por telefone
 * @param {string} customerPhone - Número do telefone (ex: 558585864202)
 * Retorna array de pedidos do cliente, ordenados do mais recente
 */
async function getCustomerOrders(customerPhone) {
  try {
    console.log(`[API] Buscando pedidos para telefone: ${customerPhone}`);
    
    // Buscar pedidos filtrando por customerPhone
    const res = await api.get('/api/orders', {
      params: {
        customerPhone: customerPhone,
        limit: 5,  // Últimos 5 pedidos
        sort: '-createdAt'  // Mais recente primeiro
      }
    });
    
    console.log(`[API] Encontrados ${res.data.length} pedidos`);
    return res.data;
    
  } catch (error) {
    console.error('[API] Erro ao buscar pedidos do cliente:', error.message);
    return []; // Retorna array vazio se der erro
  }
}
/**
 * 🆕 NOVA FUNÇÃO: Busca último pedido de um cliente
 * @param {string} customerPhone - Número do telefone
 * Retorna o último pedido ou null se não encontrar
 */
async function getLastOrder(customerPhone) {
  try {
    const orders = await getCustomerOrders(customerPhone);
    return orders.length > 0 ? orders[0] : null;
  } catch (error) {
    console.error('[API] Erro ao buscar último pedido:', error.message);
    return null;
  }
}

/**
 * 🆕 NOVA FUNÇÃO: Busca cliente cadastrado por telefone
 * @param {string} customerPhone - Número do telefone
 * Retorna dados do cliente ou null se não encontrar
 */
async function getCustomerByPhone(customerPhone) {
  try {
    console.log(`[API] Buscando cliente cadastrado: ${customerPhone}`);
    
    // Buscar todos os pedidos e filtrar no JavaScript para garantir segurança
    const res = await api.get('/api/orders', {
      params: {
        limit: 100,
        sort: '-createdAt'
      }
    });
    
    // Filtrar APENAS pedidos do telefone específico (proteção extra)
    const customerOrders = res.data.filter(order => 
      order.customerPhone === customerPhone
    );
    
    if (customerOrders.length > 0) {
      // Cliente encontrado - retornar dados do último pedido
      const lastOrder = customerOrders[0];
      console.log(`[API] Cliente encontrado: ${lastOrder.customerName}`);
      
      return {
        customerName: lastOrder.customerName,
        customerAddress: lastOrder.customerAddress,
        customerPhone: lastOrder.customerPhone,
        observations: lastOrder.observations || ''
      };
    } else {
      console.log(`[API] Cliente não encontrado: ${customerPhone}`);
      return null;
    }
    
  } catch (error) {
    console.error('[API] Erro ao buscar cliente:', error.message);
    return null;
  }
}

// 👉 exporta todas as funções
module.exports = { 
  fetchMenu, 
  createOrder, 
  getCustomerOrders, 
  getLastOrder,
  getCustomerByPhone 
};
