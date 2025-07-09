const express = require('express');
const router = express.Router();
const FidelityController = require('../controllers/fidelityController');
const authMiddleware = require('../middlewares/auth');

// Criar pontos de fidelidade
router.post('/fidelity', authMiddleware, FidelityController.createFidelity);

// Listar pontos de fidelidade do usuário
router.get('/fidelity/:userId', authMiddleware, FidelityController.getFidelity);

module.exports = router;
