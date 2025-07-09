const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/auth');

router.post('/invoice/emit', authMiddleware, invoiceController.emitInvoice);
router.get('/invoice/:orderId', authMiddleware, invoiceController.getInvoice);

module.exports = router;
