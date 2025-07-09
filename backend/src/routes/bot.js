// /backend/src/routes/bot.js
/**
 * Rotas para gerenciamento do Bot WhatsApp
 * Conecta endpoints com controller
 */

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const botController = require('../controllers/botController');

/**
 * @swagger
 * components:
 *   schemas:
 *     BotStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [disconnected, connecting, waiting_qr, connected, error]
 *         uptime:
 *           type: number
 *         startTime:
 *           type: string
 *           format: date-time
 *         lastActivity:
 *           type: string
 *           format: date-time
 *         qrCode:
 *           type: string
 *         logsCount:
 *           type: number
 *         processId:
 *           type: number
 */

/**
 * @swagger
 * /api/bot/status:
 *   get:
 *     summary: Obter status atual do bot WhatsApp
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do bot obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BotStatus'
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', auth, botController.getStatus);

/**
 * @swagger
 * /api/bot/start:
 *   post:
 *     summary: Iniciar bot WhatsApp
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot iniciado com sucesso
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
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     pid:
 *                       type: number
 *       400:
 *         description: Bot já está rodando
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro ao iniciar bot
 */
router.post('/start', auth, botController.startBot);

/**
 * @swagger
 * /api/bot/stop:
 *   post:
 *     summary: Parar bot WhatsApp
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot parado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro ao parar bot
 */
router.post('/stop', auth, botController.stopBot);

/**
 * @swagger
 * /api/bot/restart:
 *   post:
 *     summary: Reiniciar bot WhatsApp
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot reiniciado com sucesso
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro ao reiniciar bot
 */
router.post('/restart', auth, botController.restartBot);

/**
 * @swagger
 * /api/bot/qr:
 *   get:
 *     summary: Obter QR Code atual para conexão
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Code obtido com sucesso
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
 *                     qrCode:
 *                       type: string
 *                       description: QR Code em formato texto (ASCII)
 *                     status:
 *                       type: string
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/qr', auth, botController.getQRCode);

/**
 * @swagger
 * /api/bot/logs:
 *   get:
 *     summary: Obter logs recentes do bot
 *     tags: [Bot WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de logs para retornar
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           message:
 *                             type: string
 *                     total:
 *                       type: number
 *       401:
 *         description: Token de acesso inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/logs', auth, botController.getLogs);

module.exports = router;
