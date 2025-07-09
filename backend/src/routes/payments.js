const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do pagamento
 *         orderId:
 *           type: string
 *           description: ID do pedido
 *         method:
 *           type: string
 *           enum: [pix, credit_card, debit_card, cash]
 *           example: pix
 *         gateway:
 *           type: string
 *           enum: [mercadopago, pagseguro, picpay]
 *           example: mercadopago
 *         amount:
 *           type: number
 *           example: 64.80
 *         status:
 *           type: string
 *           enum: [pending, processing, approved, rejected, cancelled, refunded]
 *           example: pending
 *         transactionId:
 *           type: string
 *           description: ID da transação no gateway
 *         paymentData:
 *           type: object
 *           description: Dados específicos do gateway
 *         createdAt:
 *           type: string
 *           format: date-time
 *         approvedAt:
 *           type: string
 *           format: date-time
 *     PixPayment:
 *       type: object
 *       properties:
 *         qrCode:
 *           type: string
 *           description: Código PIX para pagamento
 *         qrCodeImage:
 *           type: string
 *           description: URL da imagem do QR Code
 *         transactionId:
 *           type: string
 *           description: ID da transação
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Data de expiração do PIX
 *     PaymentStatus:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, approved, rejected, cancelled, refunded]
 *         amount:
 *           type: number
 *         method:
 *           type: string
 *         transactionId:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /payments/{orderId}:
 *   get:
 *     summary: Obter status do pagamento
 *     tags: [Pagamentos]
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
 *         description: Status do pagamento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatus'
 *       404:
 *         description: Pagamento não encontrado
 *       401:
 *         description: Token de acesso requerido
 *   post:
 *     summary: Processar pagamento PIX
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - gateway
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [pix]
 *                 example: pix
 *               gateway:
 *                 type: string
 *                 enum: [mercadopago]
 *                 example: mercadopago
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: João Silva
 *                   email:
 *                     type: string
 *                     example: joao@email.com
 *                   document:
 *                     type: string
 *                     example: 12345678901
 *     responses:
 *       200:
 *         description: Pagamento PIX criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Payment'
 *                 - $ref: '#/components/schemas/PixPayment'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pedido não encontrado
 */

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook do MercadoPago
 *     tags: [Pagamentos]
 *     description: Endpoint para receber notificações do MercadoPago sobre status dos pagamentos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID da notificação
 *               live_mode:
 *                 type: boolean
 *                 description: Se é ambiente de produção
 *               type:
 *                 type: string
 *                 example: payment
 *               date_created:
 *                 type: string
 *                 format: date-time
 *               application_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               version:
 *                 type: integer
 *               api_version:
 *                 type: string
 *               action:
 *                 type: string
 *                 example: payment.updated
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID do pagamento no MercadoPago
 *     responses:
 *       200:
 *         description: Webhook processado com sucesso
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
 *                   example: Webhook processado com sucesso
 *       400:
 *         description: Dados inválidos do webhook
 */

/**
 * @swagger
 * /payments/pagseguro:
 *   post:
 *     summary: Processar pagamento PagSeguro
 *     tags: [Pagamentos]
 *     description: Endpoint para processar pagamentos via PagSeguro (estrutura preparada)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - method
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 60f7b1b9e4b0f40015a1b1a1
 *               method:
 *                 type: string
 *                 enum: [pix, credit_card, debit_card, boleto]
 *                 example: pix
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   document:
 *                     type: string
 *               cardData:
 *                 type: object
 *                 description: Dados do cartão (quando aplicável)
 *     responses:
 *       200:
 *         description: Pagamento PagSeguro criado
 *       501:
 *         description: Integração não implementada
 */

/**
 * @swagger
 * /payments/picpay:
 *   post:
 *     summary: Processar pagamento PicPay
 *     tags: [Pagamentos]
 *     description: Endpoint para processar pagamentos via PicPay (estrutura preparada)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 60f7b1b9e4b0f40015a1b1a1
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   document:
 *                     type: string
 *     responses:
 *       200:
 *         description: Pagamento PicPay criado
 *       501:
 *         description: Integração não implementada
 */

/**
 * @swagger
 * /payments/refund/{paymentId}:
 *   post:
 *     summary: Solicitar reembolso
 *     tags: [Pagamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Valor do reembolso (se parcial)
 *               reason:
 *                 type: string
 *                 description: Motivo do reembolso
 *                 example: Cancelamento do pedido
 *     responses:
 *       200:
 *         description: Reembolso processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 refundId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                   example: processing
 *       404:
 *         description: Pagamento não encontrado
 *       400:
 *         description: Pagamento não pode ser reembolsado
 *       401:
 *         description: Token de acesso requerido
 */
// Modelo Order simulado (já que não temos MongoDB conectado)
const Order = {
  findByIdAndUpdate: async (id, updateData) => {
    console.log('Atualizando pedido:', id, updateData);
    return { _id: id, ...updateData };
  },
  updateOne: async (filter, updateData) => {
    console.log('Atualizando pedido com filtro:', filter, updateData);
    return { acknowledged: true };
  }
};

// CRIAR PAGAMENTO PIX (MERCADO PAGO)
router.post('/mercadopago/pix', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, customerCPF, total } = req.body;

    console.log('Recebido pedido de PIX:', { orderId, customerName, total });

    const paymentData = {
      orderId,
      customerName,
      customerEmail,
      customerCPF,
      total: parseFloat(total)
    };

    const result = await paymentService.createMercadoPagoPix(paymentData);

    if (result.success) {
      console.log('PIX criado com sucesso:', result.payment_id);

      res.json({
        success: true,
        payment_id: result.payment_id,
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64
      });
    } else {
      console.error('Erro ao criar PIX:', result.error);
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro na rota PIX:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// CRIAR PAGAMENTO CARTÃO (MERCADO PAGO)
router.post('/mercadopago/card', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, total, cardData } = req.body;

    const paymentData = {
      orderId,
      customerName,
      customerEmail,
      total: parseFloat(total)
    };

    const result = await paymentService.createMercadoPagoCard(paymentData, cardData);

    if (result.success) {
      res.json({
        success: true,
        payment_id: result.payment_id,
        status: result.status
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro na rota Cartão:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// VERIFICAR STATUS DO PAGAMENTO
router.get('/status/:provider/:paymentId', async (req, res) => {
  try {
    const { provider, paymentId } = req.params;

    const result = await paymentService.checkPaymentStatus(paymentId, provider);

    if (result.success) {
      res.json({
        success: true,
        status: result.status,
        provider: result.provider
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// WEBHOOK MERCADO PAGO
router.post('/mercadopago/webhook', async (req, res) => {
  try {
    const { data, type } = req.body;
    console.log('Webhook MercadoPago recebido:', { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      const result = await paymentService.checkPaymentStatus(paymentId, 'mercadopago');

      if (result.success && result.status === 'approved') {
        console.log('Pagamento aprovado:', paymentId);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro webhook MercadoPago:', error);
    res.status(500).json({ success: false });
  }
});

// WEBHOOK MERCADO PAGO
router.post('/mercadopago/webhook', async (req, res) => {
  // ... código do webhook
});


// CRIAR PAGAMENTO PAGSEGURO
router.post('/pagseguro/checkout', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, customerPhone, total } = req.body;
    
    const paymentData = {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      total: parseFloat(total)
    };

    const result = await paymentService.createPagSeguroPayment(paymentData);
    
    if (result.success) {
      res.json({
        success: true,
        checkout_code: result.checkout_code,
        payment_url: result.payment_url,
        reference_id: result.reference_id
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro na rota PagSeguro:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// CRIAR PAGAMENTO PICPAY
router.post('/picpay/payment', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, customerCPF, customerPhone, total } = req.body;
    
    const paymentData = {
      orderId,
      customerName,
      customerEmail,
      customerCPF,
      customerPhone,
      total: parseFloat(total)
    };

    const result = await paymentService.createPicPayPayment(paymentData);
    
    if (result.success) {
      res.json({
        success: true,
        payment_url: result.payment_url,
        reference_id: result.reference_id,
        qr_code: result.qr_code,
        expires_at: result.expires_at
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro na rota PicPay:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// WEBHOOK PAGSEGURO
router.post('/pagseguro/callback', async (req, res) => {
  try {
    const { notificationCode } = req.body;
    console.log('Webhook PagSeguro recebido:', notificationCode);
    
    const result = await paymentService.checkPaymentStatus(notificationCode, 'pagseguro');
    
    if (result.success && result.status === 'Paga') {
      console.log('Pagamento PagSeguro aprovado:', notificationCode);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro webhook PagSeguro:', error);
    res.status(500).json({ success: false });
  }
});

// WEBHOOK PICPAY
router.post('/picpay/callback', async (req, res) => {
  try {
    const { referenceId, authorizationId } = req.body;
    console.log('Webhook PicPay recebido:', { referenceId, authorizationId });
    
    const result = await paymentService.checkPaymentStatus(authorizationId, 'picpay');
    
    if (result.success && result.status === 'completed') {
      console.log('Pagamento PicPay aprovado:', authorizationId);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro webhook PicPay:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
