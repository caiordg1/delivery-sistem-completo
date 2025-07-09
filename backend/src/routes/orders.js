const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// ✅ ROTAS ATUALIZADAS PARA USAR CONTROLLER (compatibilidade 100%)
// CRIAR NOVO PEDIDO - COM VINCULAÇÃO AUTOMÁTICA
router.post('/', orderController.createOrder);

// LISTAR TODOS OS PEDIDOS
router.get('/', orderController.getOrders);

// 🆕 ROTAS ESPECÍFICAS PRIMEIRO (antes de /:id)
// 🆕 NOVA ROTA - BUSCAR PEDIDOS POR TELEFONE DO CLIENTE
router.get('/by-phone/:phone', orderController.getOrdersByPhone);

// 🆕 ROTAS KANBAN ESPECÍFICAS
// Dados agrupados para Kanban
router.get('/kanban/data', orderController.getKanbanData);

// Métricas operacionais
router.get('/metrics/dashboard', orderController.getOrderMetrics);

// Alertas de pedidos
router.get('/alerts', orderController.getOrderAlerts);

// 🆕 ROTAS COM PARÂMETROS ESPECÍFICOS (antes de /:id genérico)
// Gestão de status avançada
router.patch('/:id/status', orderController.updateOrderStatus);

// Sistema de observações
router.post('/:id/observations', orderController.addObservation);
router.get('/:id/observations', orderController.getObservations);

// Histórico do pedido
router.get('/:id/history', orderController.getOrderHistory);

// ✅ ROTAS GENÉRICAS POR ÚLTIMO
// BUSCAR PEDIDO POR ID
router.get('/:id', orderController.getOrderById);

// ATUALIZAR PEDIDO
router.patch('/:id', orderController.updateOrder);

// DELETAR PEDIDO
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
