const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'cliente'], default: 'cliente' },
  
  // NOVOS CAMPOS ADICIONADOS:
  telefone: { type: String, required: false },
  endereco: { type: String, required: false },
  dataNascimento: { type: Date, required: false },
  
  // Sistema de Fidelidade
  loyalty: {
    points: { type: Number, default: 0 },
    level: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    totalPurchases: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
