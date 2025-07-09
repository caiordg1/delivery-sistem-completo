const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/auth');

// Listar todos os itens do cardápio
router.get('/', menuController.getMenuItems);

// Adicionar um item novo no cardápio (apenas admin)
router.post('/menu', authMiddleware, menuController.addMenuItem);

module.exports = router;
