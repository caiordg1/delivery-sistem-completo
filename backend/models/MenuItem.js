const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  preco: Number
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
