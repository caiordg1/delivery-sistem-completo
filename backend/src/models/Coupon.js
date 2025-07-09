const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
  },
  minOrder: { 
    type: Number, 
    default: 0 
  },
  maxDiscount: { 
    type: Number, 
    default: null 
  },
  validFrom: { 
    type: Date, 
    default: Date.now 
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    default: null 
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  applicableProducts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  userRestrictions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
