const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/auth');

// COTAÇÃO DE FRETE
router.post('/quote', deliveryController.getQuote);

// SOLICITAR ENTREGA
router.post('/request', authMiddleware, deliveryController.requestDelivery);

// RASTREAR ENTREGA
router.get('/track/:orderId', deliveryController.trackDelivery);

// RASTREAR POR CÓDIGO
router.get('/track', deliveryController.trackDelivery);

// CANCELAR ENTREGA
router.delete('/cancel/:orderId', authMiddleware, deliveryController.cancelDelivery);

// LISTAR ENTREGAS (ADMIN)
router.get('/list', authMiddleware, deliveryController.listDeliveries);

// VALIDAR ENDEREÇO (PÚBLICO)
router.post('/validate-address', async (req, res) => {
  try {
    const loggiService = require('../services/loggiService');
    const result = await loggiService.validateAddress(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao validar endereço'
    });
  }
});

module.exports = router;
