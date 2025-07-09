const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  category: { 
    type: String,
    enum: ['pizzas-tradicionais', 'pizzas-especiais', 'esfirras', 'refrigerantes'],
    required: true,
    default: 'pizzas-tradicionais'
  },
  available: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
