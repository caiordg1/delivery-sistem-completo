const express = require('express');
const router = express.Router();
const printerController = require('../controllers/printerController');
const authMiddleware = require('../middlewares/auth');

// Todas as rotas precisam autenticação admin
router.use(authMiddleware);

// Listar impressoras
router.get('/', printerController.listPrinters);

// Teste de impressão
router.post('/test', printerController.testPrint);

// Reimprimir pedido
router.post('/reprint/:orderId', printerController.reprintOrder);

// Status da impressora
router.get('/status/:printerName', printerController.getPrinterStatus);

module.exports = router;
