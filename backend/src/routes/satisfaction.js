const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { businessLogger } = require('../middlewares/loggerMiddleware');
const {
    createFeedback,
    getAllFeedbacks,
    getFeedbackById,
    respondToFeedback,
    getSatisfactionStats,
    getEligibleOrdersForSurvey
} = require('../controllers/satisfactionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       required:
 *         - orderId
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do feedback
 *         orderId:
 *           type: string
 *           description: ID do pedido
 *         userId:
 *           type: string
 *           description: ID do usuário (opcional)
 *         customerName:
 *           type: string
 *           description: Nome do cliente
 *         customerPhone:
 *           type: string
 *           description: Telefone do cliente
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Avaliação de 1 a 5 estrelas
 *           example: 4
 *         comment:
 *           type: string
 *           description: Comentário opcional
 *           example: Entrega rápida e comida deliciosa!
 *         category:
 *           type: string
 *           enum: [general, product, delivery, service]
 *           description: Categoria do feedback
 *           example: delivery
 *         orderValue:
 *           type: number
 *           description: Valor do pedido
 *         deliveryTime:
 *           type: integer
 *           description: Tempo de entrega em minutos
 *         status:
 *           type: string
 *           enum: [pending, responded]
 *           description: Status do feedback
 *         response:
 *           type: string
 *           description: Resposta da empresa
 *         respondedBy:
 *           type: string
 *           description: Nome do admin que respondeu
 *         respondedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SatisfactionStats:
 *       type: object
 *       properties:
 *         general:
 *           type: object
 *           properties:
 *             totalFeedbacks:
 *               type: integer
 *             averageRating:
 *               type: number
 *             averageDeliveryTime:
 *               type: number
 *             satisfactionRate:
 *               type: number
 *         ratingDistribution:
 *           type: object
 *         dailyTrend:
 *           type: array
 *         categoryIssues:
 *           type: array
 */

/**
 * @swagger
 * /satisfaction/feedback:
 *   post:
 *     summary: Criar feedback de satisfação
 *     tags: [Satisfação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 60f7b1b9e4b0f40015a1b1a1
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excelente atendimento e entrega rápida!
 *               category:
 *                 type: string
 *                 enum: [general, product, delivery, service]
 *                 example: delivery
 *     responses:
 *       201:
 *         description: Feedback criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Feedback já existe para este pedido
 *       404:
 *         description: Pedido não encontrado
 */
router.post('/feedback', businessLogger('feedback_submitted'), createFeedback);

/**
 * @swagger
 * /satisfaction/feedbacks:
 *   get:
 *     summary: Listar todos os feedbacks (admin)
 *     tags: [Satisfação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrar por avaliação
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, general, product, delivery, service]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, responded]
 *         description: Filtrar por status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Lista de feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 pagination:
 *                   type: object
 *                 statistics:
 *                   type: object
 */
router.get('/feedbacks', authMiddleware, businessLogger('feedbacks_viewed'), getAllFeedbacks);

/**
 * @swagger
 * /satisfaction/feedback/{id}:
 *   get:
 *     summary: Obter feedback específico
 *     tags: [Satisfação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do feedback
 *     responses:
 *       200:
 *         description: Feedback encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       404:
 *         description: Feedback não encontrado
 */
router.get('/feedback/:id', authMiddleware, getFeedbackById);

/**
 * @swagger
 * /satisfaction/feedback/{id}/respond:
 *   post:
 *     summary: Responder a um feedback
 *     tags: [Satisfação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 example: Obrigado pelo seu feedback! Estamos sempre trabalhando para melhorar nosso serviço.
 *               adminName:
 *                 type: string
 *                 example: João Silva
 *     responses:
 *       200:
 *         description: Resposta enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       404:
 *         description: Feedback não encontrado
 */
router.post('/feedback/:id/respond', authMiddleware, businessLogger('feedback_response_sent'), respondToFeedback);

/**
 * @swagger
 * /satisfaction/stats:
 *   get:
 *     summary: Obter estatísticas de satisfação
 *     tags: [Satisfação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Período em dias
 *     responses:
 *       200:
 *         description: Estatísticas de satisfação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SatisfactionStats'
 */
router.get('/stats', authMiddleware, businessLogger('satisfaction_stats_viewed'), getSatisfactionStats);

/**
 * @swagger
 * /satisfaction/eligible-orders:
 *   get:
 *     summary: Obter pedidos elegíveis para pesquisa
 *     tags: [Satisfação]
 *     security:
 *       - bearerAuth: []
 *     description: Retorna pedidos entregues nas últimas 24h que ainda não receberam pesquisa de satisfação
 *     responses:
 *       200:
 *         description: Lista de pedidos elegíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       customer:
 *                         type: object
 *                       total:
 *                         type: number
 *                       deliveredAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 */
router.get('/eligible-orders', authMiddleware, getEligibleOrdersForSurvey);

module.exports = router;
