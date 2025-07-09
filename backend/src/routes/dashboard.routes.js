const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // ✅ Caminho correto

const dashboardController = require('../controllers/dashboardController');

// ✅ Caminho certo da rota:
router.get('/metrics', auth, dashboardController.getMetrics);

module.exports = router;
