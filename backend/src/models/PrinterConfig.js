const mongoose = require('mongoose');

const printerConfigSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  type: { 
    type: String, 
    default: 'EPSON' 
  },
  interface: { 
    type: String, 
    required: true 
  },
  width: { 
    type: Number, 
    default: 48 
  },
  enabled: { 
    type: Boolean, 
    default: true 
  },
  categories: [{ 
    type: String 
  }],
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PrinterConfig', printerConfigSchema);
