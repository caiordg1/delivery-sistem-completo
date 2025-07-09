const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Imagem enviada com sucesso!
 *         imageUrl:
 *           type: string
 *           example: /uploads/products/product-1640995200000-123456789.jpg
 *         fileName:
 *           type: string
 *           example: product-1640995200000-123456789.jpg
 *         originalName:
 *           type: string
 *           example: pizza-margherita.jpg
 *         size:
 *           type: number
 *           example: 245760
 */

/**
 * @swagger
 * /upload/product:
 *   post:
 *     summary: Upload de imagem de produto
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem (JPEG, PNG, GIF, WebP - máx 5MB)
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Nenhuma imagem enviada ou tipo inválido
 *       401:
 *         description: Token de acesso requerido
 *       413:
 *         description: Arquivo muito grande (máx 5MB)
 */

/**
 * @swagger
 * /upload/product/list:
 *   get:
 *     summary: Listar todas as imagens de produtos
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de imagens retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       url:
 *                         type: string
 *                       size:
 *                         type: number
 */

/**
 * @swagger
 * /upload/product/{fileName}:
 *   delete:
 *     summary: Deletar imagem de produto
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo da imagem
 *     responses:
 *       200:
 *         description: Imagem deletada com sucesso
 *       404:
 *         description: Imagem não encontrada
 *       401:
 *         description: Token de acesso requerido
 */

// ==================== ROTAS DE UPLOAD ====================

// Upload de imagem de produto (requer autenticação)
router.post('/upload/product', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadProductImage);

// Listar imagens de produtos (requer autenticação)
router.get('/upload/product/list', authMiddleware, uploadController.listProductImages);

// Deletar imagem de produto (requer autenticação)
router.delete('/upload/product/:fileName', authMiddleware, uploadController.deleteProductImage);

module.exports = router;
