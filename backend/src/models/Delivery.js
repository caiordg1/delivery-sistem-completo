const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  provider: { type: String, enum: ['loggi', 'zapdelivery', 'uello', 'borzo'], required: true },
  externalId: { type: String }, // ID da transportadora
  trackingCode: { type: String },
  status: { type: String, enum: ['pending', 'searching', 'accepted', 'pickup', 'in_transit', 'delivered', 'cancelled', 'failed'], default: 'pending' },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  deliveryFee: { type: Number, default: 0 },
  addressFrom: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: [Number] // [lng, lat]
  },
  addressTo: {
    recipientName: String,
    phone: String,
    email: String,
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: [Number] // [lng, lat]
  },
  packageInfo: {
    width: Number,
    height: Number,
    length: Number,
    weight: Number,
    totalValue: Number,
    instructions: String
  },
  courierInfo: {
    name: String,
    phone: String,
    vehicle: String,
    photo: String,
    rating: Number,
    location: [Number] // [lng, lat]
  },
  providerData: mongoose.Schema.Types.Mixed, // Dados específicos do provedor
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
