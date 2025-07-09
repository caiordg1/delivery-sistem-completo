const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: [
    'https://admin.fortalcar.com',
    'https://cardapio.fortalcar.com',
    'https://fortalcar.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
const menuRoutes = require('./routes/menuRoutes');

// ROTAS - Apenas as que existem
//const authRoutes = require('./routes/auth');
//const userRoutes = require('./routes/users');
//const orderRoutes = require('./routes/orders');

// REGISTRAR ROTAS
//app.use('/api/orders', orderRoutes);
//app.use('/api/payments', paymentRoutes);
//app.use('/api/auth', authRoutes);

// Rota de teste
app.use('/menu', menuRoutes);
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API do sistema de delivery está online!',
    timestamp: new Date().toISOString()
  });
});

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado ao MongoDB!'))
.catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;
