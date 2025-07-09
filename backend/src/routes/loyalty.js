const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
/**
 * @swagger
 * components:
 *   schemas:
 *     LoyaltyLevel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           example: Gold
 *         pointsRequired:
 *           type: number
 *           example: 5000
 *         benefits:
 *           type: string
 *           example: 10% de desconto + frete grátis
 *         discountPercentage:
 *           type: number
 *           example: 10
 *         freeDelivery:
 *           type: boolean
 *           example: true
 *     UserLoyalty:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         points:
 *           type: number
 *           example: 2500
 *         level:
 *           type: string
 *           example: Silver
 *         totalPurchases:
 *           type: number
 *           example: 1250.75
 *         purchaseCount:
 *           type: number
 *           example: 15
 *         loyaltyHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [earned, redeemed]
 *               points:
 *                 type: number
 *               orderId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 */

/**
 * @swagger
 * /api/loyalty/levels:
 *   get:
 *     summary: Listar níveis de fidelidade
 *     tags: [Fidelidade]
 *     responses:
 *       200:
 *         description: Lista de níveis de fidelidade
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LoyaltyLevel'
 */

/**
 * @swagger
 * /api/loyalty/user/{id}:
 *   get:
 *     summary: Obter pontos de fidelidade do usuário
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados de fidelidade do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoyalty'
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token de acesso requerido
 */

/**
 * @swagger
 * /api/loyalty/add-points:
 *   post:
 *     summary: Adicionar pontos manualmente
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - points
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60f7b1b9e4b0f40015a1b1a1
 *               points:
 *                 type: number
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: Pontos de bônus por indicação
 *               orderId:
 *                 type: string
 *                 description: ID do pedido (opcional)
 *     responses:
 *       200:
 *         description: Pontos adicionados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pontos adicionados com sucesso
 *                 newPoints:
 *                   type: number
 *                   example: 2600
 *                 newLevel:
 *                   type: string
 *                   example: Gold
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token de acesso requerido
 */

/**
 * @swagger
 * /api/loyalty/history/{userId}:
 *   get:
 *     summary: Obter histórico de pontos do usuário
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Limite de registros
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página
 *     responses:
 *       200:
 *         description: Histórico de pontos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [earned, redeemed]
 *                       points:
 *                         type: number
 *                       orderId:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       description:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token de acesso requerido
 */
// GET /api/loyalty/:userId - Obter pontos e informações de fidelidade
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('loyalty name email');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      loyalty: user.loyalty,
      userName: user.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar informações de fidelidade', error: error.message });
  }
});

// POST /api/loyalty/add-points - Adicionar pontos (interno/admin)
router.post('/add-points', auth, async (req, res) => {
  try {
    const { userId, points, purchaseValue } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Adicionar pontos e atualizar estatísticas
    user.loyalty.points += points;
    user.loyalty.totalPurchases += purchaseValue || 0;
    user.loyalty.purchaseCount += 1;

    // Calcular novo nível baseado em pontos
    if (user.loyalty.points >= 10000) {
      user.loyalty.level = 'Platinum';
    } else if (user.loyalty.points >= 5000) {
      user.loyalty.level = 'Gold';
    } else if (user.loyalty.points >= 1000) {
      user.loyalty.level = 'Silver';
    } else {
      user.loyalty.level = 'Bronze';
    }

    await user.save();

    res.json({
      success: true,
      message: 'Pontos adicionados com sucesso',
      loyalty: user.loyalty
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar pontos', error: error.message });
  }
});

// GET /api/loyalty/levels - Obter informações dos níveis
router.get('/info/levels', async (req, res) => {
  try {
    const levels = {
      Bronze: { minPoints: 0, benefits: 'Acesso básico ao programa' },
      Silver: { minPoints: 1000, benefits: '5% de desconto em pedidos' },
      Gold: { minPoints: 5000, benefits: '10% de desconto + frete grátis' },
      Platinum: { minPoints: 10000, benefits: '15% de desconto + benefícios exclusivos' }
    };

    res.json({ success: true, levels });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar informações dos níveis', error: error.message });
  }
});

module.exports = router;
