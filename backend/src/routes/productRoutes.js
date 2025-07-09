const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do produto
 *         name:
 *           type: string
 *           description: Nome do produto
 *           example: Pizza Margherita
 *         description:
 *           type: string
 *           description: Descrição do produto
 *           example: Pizza com molho de tomate, mussarela e manjericão
 *         price:
 *           type: number
 *           description: Preço do produto
 *           example: 29.90
 *         category:
 *           type: string
 *           description: Categoria do produto
 *           example: Pizzas
 *         image:
 *           type: string
 *           description: URL da imagem do produto
 *         available:
 *           type: boolean
 *           description: Se o produto está disponível
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Listar todos os produtos do cardápio
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *   post:
 *     summary: Criar novo produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pizza Calabresa
 *               description:
 *                 type: string
 *                 example: Pizza com calabresa e cebola
 *               price:
 *                 type: number
 *                 example: 32.90
 *               category:
 *                 type: string
 *                 example: Pizzas
 *               image:
 *                 type: string
 *                 example: /uploads/pizza-calabresa.jpg
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Token de acesso requerido
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /menu/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 *   patch:
 *     summary: Atualizar produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               available:
 *                 type: boolean
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Token de acesso requerido
 *   delete:
 *     summary: Deletar produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Token de acesso requerido
 */

/**
 * @swagger
 * /menu/{id}/toggle:
 *   patch:
 *     summary: Alternar status do produto (ativo/inativo)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Status do produto alterado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Token de acesso requerido
 */

// ==================== ROTAS DOS PRODUTOS ====================

// Listar cardápio (público)
router.get('/products', productController.getMenu);

// Criar produto no cardápio (requer autenticação)
router.post('/products', authMiddleware, productController.createProduct);

// Obter produto específico por ID (público)
router.get('/products/:id', productController.getProductById);

// Atualizar produto (requer autenticação)
router.patch('/products/:id', authMiddleware, productController.updateProduct);

// Deletar produto (requer autenticação)
router.delete('/products/:id', authMiddleware, productController.deleteProduct);

// Alternar status do produto (requer autenticação)
router.patch('/products/:id/toggle', authMiddleware, productController.toggleProductStatus);

module.exports = router;
