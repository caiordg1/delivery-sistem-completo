const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ✅ CAMPOS EXISTENTES PRESERVADOS (NÃO ALTERAR)
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // ← MANTIDO (pedidos WhatsApp não têm usuário)
  },
  
  // 🆕 NOVO CAMPO - VINCULAÇÃO AUTOMÁTICA COM CLIENTE
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // ← Opcional para compatibilidade
  },
  
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    observation: { type: String }
  }],
  total: { type: Number, required: true },
  
  // 🔄 STATUS COMPATÍVEL - EVOLUÇÃO GRADUAL
  status: { 
    type: String, 
    enum: [
      'pendente',           // ← MANTIDO para compatibilidade
      'recebido',           // ← NOVO (mapeado de 'pendente')
      'em_preparo', 
      'aguardando_entregador', 
      'saiu_para_entrega', 
      'entregue', 
      'cancelado'
    ],
    default: 'pendente'     // ← MANTIDO temporariamente
  },
  
  orderNumber: { type: String, unique: true },
  
  // ✅ DADOS DO CLIENTE PRESERVADOS
  customerName: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },
  
  // 🆕 NOVOS CAMPOS PARA CONTROLE DE ORIGEM
  source: { 
    type: String, 
    enum: ['whatsapp', 'telefone', 'instagram', 'manual'], 
    default: 'manual' 
  },
  
  // ✅ SISTEMA DE SATISFAÇÃO PRESERVADO
  deliveredAt: { type: Date },
  surveyRequested: { type: Boolean, default: false },
  surveyScheduledAt: { type: Date },
  surveySentAt: { type: Date },
  surveyRespondedAt: { type: Date },
  
  // 🆕 NOVOS CAMPOS KANBAN (SEM QUEBRAR EXISTENTES)
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    user: { type: String, default: 'Sistema' },
    observation: { type: String }
  }],
  
  // 🆕 CAMPOS DE GESTÃO TEMPORAL
  estimatedTime: { type: Number }, // em minutos
  priority: { 
    type: String, 
    enum: ['baixa', 'normal', 'alta', 'urgente'], 
    default: 'normal' 
  },
  
  // 🆕 SISTEMA DE OBSERVAÇÕES
  observations: [{ 
    text: { type: String, required: true },
    user: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' }
  }],
  
  // 🆕 MÉTRICAS DE TEMPO
  kitchenStartTime: { type: Date },
  deliveryStartTime: { type: Date },
  timeMetrics: {
    preparationTime: { type: Number }, // tempo real de preparo em minutos
    deliveryTime: { type: Number },    // tempo real de entrega em minutos
    totalTime: { type: Number }        // tempo total do pedido em minutos
  }
}, {
  timestamps: true // ✅ PRESERVADO (createdAt, updatedAt automático)
});

// 🔄 MIDDLEWARE PARA COMPATIBILIDADE DE STATUS
orderSchema.pre('save', function(next) {
  // Inicializar statusHistory se não existir
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      timestamp: this.createdAt || new Date(),
      user: 'Sistema',
      observation: 'Pedido criado'
    }];
  }
  
  // Inicializar campos de métricas se não existir
  if (!this.timeMetrics) {
    this.timeMetrics = {
      preparationTime: null,
      deliveryTime: null,
      totalTime: null
    };
  }
  
  // Inicializar observações se não existir
  if (!this.observations) {
    this.observations = [];
  }
  
  next();
});

// Gerar número do pedido automaticamente
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
     const lastOrder = await mongoose.model('Order').findOne().sort({ orderNumber: -1 });
     const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber) : 0;
     this.orderNumber = (lastNumber + 1).toString().padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
