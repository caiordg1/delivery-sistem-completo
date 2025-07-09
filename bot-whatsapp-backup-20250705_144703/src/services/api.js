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
async function fetchMenu () {
  const res = await api.get('/api/menu');
  return res.data;        // ajuste se seu endpoint retornar outro formato
}
/**
 * Cria um pedido no backend
 * @param {Object} payload { customerName, items: [ { productId, qty } ] }
 * Retorna o objeto criado (inclui _id)
 */
async function createOrder (payload) {
  // 🆕 ADICIONANDO SOURCE WHATSAPP AUTOMATICAMENTE
  const orderData = { 
    ...payload, 
    source: 'whatsapp' 
  };
  
  const res = await api.post('/api/orders', orderData);
  return res.data;
}
// 👉 exporta as duas funções de uma vez
module.exports = { fetchMenu, createOrder };
