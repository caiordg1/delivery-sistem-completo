const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Order = require('../models/Order');

// CRIAR PAGAMENTO PIX (MERCADO PAGO)
router.post('/mercadopago/pix', async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, customerCPF, total } = req.body;

    const paymentData = {
      orderId,
      customerName,
      customerEmail,
      customerCPF,
      total: parseFloat(total)
    };

    const result = await paymentService.createMercadoPagoPix(paymentData);

    if (result.success) {
      // Atualizar pedido com dados do pagamento
      await Order.findByIdAndUpdate(orderId, {
        payment: {
          provider: 'mercadopago',
          method: 'pix',
          payment_id: result.payment_id,
          status: 'pending'
        }
      });

      res.json({
        success: true,
        payment_id: result.payment_id,
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64
      });
    } else {
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
      await Order.findByIdAndUpdate(orderId, {
        payment: {
          provider: 'mercadopago',
          method: 'card',
          payment_id: result.payment_id,
          status: result.status
        }
      });

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

// CRIAR PAGAMENTO PICPAY
router.post('/picpay', async (req, res) => {
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
      await Order.findByIdAndUpdate(orderId, {
        payment: {
          provider: 'picpay',
          method: 'pix',
          reference_id: result.reference_id,
          status: 'pending'
        }
      });

      res.json({
        success: true,
        payment_url: result.payment_url,
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

    if (type === 'payment') {
      const paymentId = data.id;
      const result = await paymentService.checkPaymentStatus(paymentId, 'mercadopago');

      if (result.success && result.status === 'approved') {
        // Atualizar pedido como pago
        await Order.updateOne(
          { 'payment.payment_id': paymentId },
          { 
            'payment.status': 'approved',
            status: 'confirmed'
          }
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro webhook MercadoPago:', error);
    res.status(500).json({ success: false });
  }
});

// WEBHOOK PICPAY
router.post('/picpay/webhook', async (req, res) => {
  try {
    const { referenceId, status } = req.body;

    if (status === 'paid') {
      // Atualizar pedido como pago
      await Order.updateOne(
        { 'payment.reference_id': referenceId },
        { 
          'payment.status': 'approved',
          status: 'confirmed'
        }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro webhook PicPay:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
