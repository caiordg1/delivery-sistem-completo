const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    printer: {
        type: String,
        required: true,
        enum: ['kitchen', 'bar', 'expedition'],
        index: true
    },
    success: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    retryCount: {
        type: Number,
        default: 0
    },
    metadata: {
        printerType: String,
        connectionType: String,
        templateUsed: String,
        itemsCount: Number,
        totalValue: Number
    }
}, {
    timestamps: true,
    collection: 'printjobs'
});

// Índices compostos para queries otimizadas
printJobSchema.index({ orderId: 1, printer: 1 });
printJobSchema.index({ timestamp: -1, success: 1 });
printJobSchema.index({ printer: 1, timestamp: -1 });

// Método estático para estatísticas
printJobSchema.statics.getStats = async function(startDate, endDate) {
    const stats = await this.aggregate([
        {
            $match: {
                timestamp: {
                    $gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000), // Último dia
                    $lte: endDate || new Date()
                }
            }
        },
        {
            $group: {
                _id: {
                    printer: '$printer',
                    success: '$success'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.printer',
                total: { $sum: '$count' },
                successful: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
                    }
                },
                failed: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
                    }
                }
            }
        },
        {
            $project: {
                printer: '$_id',
                total: 1,
                successful: 1,
                failed: 1,
                successRate: {
                    $multiply: [
                        { $divide: ['$successful', '$total'] },
                        100
                    ]
                }
            }
        }
    ]);

    return stats;
};

// Método estático para últimas impressões
printJobSchema.statics.getRecentJobs = async function(limit = 50) {
    return await this.find()
        .populate('orderId', 'orderNumber customer.name total')
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('orderId printer success message timestamp retryCount');
};

// Método estático para impressões de um pedido específico
printJobSchema.statics.getOrderPrintHistory = async function(orderId) {
    return await this.find({ orderId })
        .sort({ timestamp: -1 })
        .select('printer success message timestamp retryCount');
};

// Middleware para limpeza automática (manter apenas 30 dias)
printJobSchema.pre('save', function() {
    // Auto limpeza será feita via cron job separado
});

// Método de instância para retry
printJobSchema.methods.retry = async function() {
    this.retryCount += 1;
    return await this.save();
};

// Virtual para tempo decorrido
printJobSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dia(s) atrás`;
});

// Configurar virtuals
printJobSchema.set('toJSON', { virtuals: true });
printJobSchema.set('toObject', { virtuals: true });

const PrintJob = mongoose.model('PrintJob', printJobSchema);

module.exports = PrintJob;
