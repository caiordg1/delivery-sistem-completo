const express = require('express');
const router = express.Router();
const printerController = require('../controllers/printerController');
const auth = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(auth);

/**
 * @swagger
 * /api/printers/status:
 *   get:
 *     summary: Obter status de todas as impressoras
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status das impressoras obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     printers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           name:
 *                             type: string
 *                           connected:
 *                             type: boolean
 *                           enabled:
 *                             type: boolean
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', printerController.getPrintersStatus);

/**
 * @swagger
 * /api/printers/reprint/{orderId}:
 *   post:
 *     summary: Reimprimir pedido específico
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido para reimpressão
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               printer:
 *                 type: string
 *                 description: Impressora específica (opcional)
 *                 enum: [kitchen, bar, expedition]
 *     responses:
 *       200:
 *         description: Reimpressão realizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/reprint/:orderId', printerController.reprintOrder);

/**
 * @swagger
 * /api/printers/test/{printer}:
 *   post:
 *     summary: Teste de impressão em impressora específica
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: printer
 *         required: true
 *         schema:
 *           type: string
 *           enum: [kitchen, bar, expedition]
 *         description: Impressora para teste
 *     responses:
 *       200:
 *         description: Teste enviado com sucesso
 *       400:
 *         description: Impressora inválida
 *       500:
 *         description: Erro no teste
 */
router.post('/test/:printer', printerController.testPrint);

/**
 * @swagger
 * /api/printers/print/{orderId}:
 *   post:
 *     summary: Imprimir pedido manualmente
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido para impressão
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               printers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [kitchen, bar, expedition]
 *                 description: Impressoras específicas (opcional)
 *     responses:
 *       200:
 *         description: Impressão realizada com sucesso
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro na impressão
 */
router.post('/print/:orderId', printerController.printOrder);

/**
 * @swagger
 * /api/printers/history:
 *   get:
 *     summary: Obter histórico de impressões
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Itens por página
 *       - in: query
 *         name: printer
 *         schema:
 *           type: string
 *           enum: [kitchen, bar, expedition]
 *         description: Filtrar por impressora
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filtrar por sucesso/falha
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Filtrar por pedido específico
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
 *         description: Histórico obtido com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/history', printerController.getPrintHistory);

/**
 * @swagger
 * /api/printers/history/{orderId}:
 *   get:
 *     summary: Histórico de impressões de um pedido específico
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Histórico do pedido obtido com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/history/:orderId', printerController.getOrderPrintHistory);

/**
 * @swagger
 * /api/printers/stats:
 *   get:
 *     summary: Estatísticas de impressão
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (padrão: 7 dias atrás)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (padrão: hoje)
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: array
 *                       description: Estatísticas gerais por impressora
 *                     daily:
 *                       type: array
 *                       description: Estatísticas diárias
 *                     hourly:
 *                       type: array
 *                       description: Estatísticas por horário
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', printerController.getPrintStats);

/**
 * @swagger
 * /api/printers/config/{printer}:
 *   patch:
 *     summary: Atualizar configuração de impressora
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: printer
 *         required: true
 *         schema:
 *           type: string
 *           enum: [kitchen, bar, expedition]
 *         description: Impressora para configurar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Habilitar/desabilitar impressora
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Categorias que a impressora deve processar
 *               template:
 *                 type: string
 *                 enum: [kitchen, bar, expedition]
 *                 description: Template a ser usado
 *               config:
 *                 type: object
 *                 description: Configurações específicas da impressora
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Impressora não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/config/:printer', printerController.updatePrinterConfig);

/**
 * @swagger
 * /api/printers/clean-logs:
 *   delete:
 *     summary: Limpar logs antigos de impressão
 *     tags: [Impressoras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Remover logs mais antigos que X dias
 *     responses:
 *       200:
 *         description: Logs limpos com sucesso
 *       500:
 *         description: Erro na limpeza
 */
router.delete('/clean-logs', printerController.cleanOldLogs);

module.exports = router;
