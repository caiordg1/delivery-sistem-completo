const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    category: {
        type: String,
        enum: ['produto', 'entrega', 'serviço', 'geral'],
        default: 'geral'
    },
    source: {
        type: String,
        enum: ['whatsapp_auto', 'web', 'manual'],
        default: 'web'
    },
    status: {
        type: String,
        enum: ['pendente', 'respondido', 'resolvido'],
        default: 'pendente'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
