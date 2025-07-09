const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers, getUserById, updateUser, deleteUser, getUserOrders } = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Rotas existentes
router.post('/users', registerUser);
router.get('/users', authMiddleware, getAllUsers);

// NOVAS ROTAS ADICIONADAS:
router.get('/users/:id', authMiddleware, getUserById);
router.patch('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);
router.get('/users/:id/orders', authMiddleware, getUserOrders);

module.exports = router;
