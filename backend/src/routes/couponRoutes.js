const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const auth = require('../middlewares/auth');
/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - type
 *         - value
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do cupom
 *         code:
 *           type: string
 *           description: Código do cupom
 *           example: DESCONTO10
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Tipo do desconto
 *           example: percentage
 *         value:
 *           type: number
 *           description: Valor do desconto
 *           example: 10
 *         minOrder:
 *           type: number
 *           description: Valor mínimo do pedido
 *           example: 50.00
 *         maxDiscount:
 *           type: number
 *           description: Desconto máximo em reais
 *           example: 20.00
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Data de início da validade
 *         validUntil:
 *           type: string
 *           format: date-time
 *           description: Data de fim da validade
 *         usageLimit:
 *           type: number
 *           description: Limite de uso do cupom
 *           example: 100
 *         usedCount:
 *           type: number
 *           description: Quantidade de vezes usado
 *           example: 25
 *         isActive:
 *           type: boolean
 *           description: Se o cupom está ativo
 *           example: true
 *         applicableProducts:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs dos produtos aplicáveis
 *         userRestrictions:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs dos usuários com acesso
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CouponValidation:
 *       type: object
 *       properties:
 *         valid:
 *           type: boolean
 *           example: true
 *         discount:
 *           type: number
 *           example: 5.00
 *         message:
 *           type: string
 *           example: Cupom aplicado com sucesso
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Listar todos os cupons
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por cupons ativos
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed]
 *         description: Filtrar por tipo de desconto
 *     responses:
 *       200:
 *         description: Lista de cupons retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Token de acesso requerido
 *   post:
 *     summary: Criar novo cupom
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *                 example: NATAL2024
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               value:
 *                 type: number
 *                 example: 15
 *               minOrder:
 *                 type: number
 *                 example: 30.00
 *               maxDiscount:
 *                 type: number
 *                 example: 25.00
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: number
 *                 example: 50
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Cupom criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Dados inválidos ou código já existe
 *       401:
 *         description: Token de acesso requerido
 */

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validar cupom de desconto
 *     tags: [Cupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderValue
 *             properties:
 *               code:
 *                 type: string
 *                 example: DESCONTO10
 *               orderValue:
 *                 type: number
 *                 example: 75.50
 *               userId:
 *                 type: string
 *                 description: ID do usuário (opcional)
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs dos produtos no carrinho
 *     responses:
 *       200:
 *         description: Validação do cupom realizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CouponValidation'
 *       400:
 *         description: Cupom inválido ou expirado
 */

/**
 * @swagger
 * /api/coupons/{id}:
 *   get:
 *     summary: Obter cupom por ID
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cupom
 *     responses:
 *       200:
 *         description: Cupom encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       404:
 *         description: Cupom não encontrado
 *       401:
 *         description: Token de acesso requerido
 *   patch:
 *     summary: Atualizar cupom
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cupom
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               usageLimit:
 *                 type: number
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               maxDiscount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cupom atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       404:
 *         description: Cupom não encontrado
 *       401:
 *         description: Token de acesso requerido
 *   delete:
 *     summary: Desativar cupom
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cupom
 *     responses:
 *       200:
 *         description: Cupom desativado com sucesso
 *       404:
 *         description: Cupom não encontrado
 *       401:
 *         description: Token de acesso requerido
 */

/**
 * @swagger
 * /api/coupons/{id}/usage:
 *   get:
 *     summary: Obter relatório de uso do cupom
 *     tags: [Cupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cupom
 *     responses:
 *       200:
 *         description: Relatório de uso do cupom
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *                 totalUsage:
 *                   type: number
 *                   example: 25
 *                 totalDiscount:
 *                   type: number
 *                   example: 125.50
 *                 usageByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: number
 *       404:
 *         description: Cupom não encontrado
 *       401:
 *         description: Token de acesso requerido
 */
// Rotas públicas
router.post('/validate', couponController.validateCoupon);

// Rotas protegidas (admin)
router.post('/', auth, couponController.createCoupon);
router.get('/', auth, couponController.listCoupons);
router.get('/:id', auth, couponController.getCoupon);
router.patch('/:id', auth, couponController.updateCoupon);
router.delete('/:id', auth, couponController.deleteCoupon);
router.post('/apply', auth, couponController.applyCoupon);
router.get('/:id/usage', auth, couponController.getCouponUsage);

module.exports = router;
