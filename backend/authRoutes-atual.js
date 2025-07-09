const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

console.log('AuthRoutes arquivo carregado!');
console.log('LoginUser tipo:', typeof loginUser);
// Rota pública: loginUser
router.post('/login', loginUser);


// Rota protegida de exemplo
router.get('/secret', authMiddleware, (req, res) => {
  res.json({
    message: 'Você acessou uma rota protegida!',
    user: req.user
  });
});

module.exports = router;
