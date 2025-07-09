const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const cashbackController = require('../controllers/cashbackController');

// Criar novo cashback (admin)
router.post('/cashback', authMiddleware, cashbackController.createCashback);

// Listar cashbacks de um usuário
router.get('/cashback/:userId', authMiddleware, cashbackController.listUserCashbacks);

module.exports = router;
