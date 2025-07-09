const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    required: true 
  },
  printerName: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'printing', 'success', 'failed'],
    default: 'pending' 
  },
  error: { 
    type: String 
  },
  printedAt: { 
    type: Date 
  },
  attempts: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PrintJob', printJobSchema);
