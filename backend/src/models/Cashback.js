const mongoose = require('mongoose');

const cashbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false }
});

module.exports = mongoose.model('Cashback', cashbackSchema);
