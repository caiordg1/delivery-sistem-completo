const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { systemLogger } = require('../config/logger');

// Criar feedback de satisfação
const createFeedback = async (req, res) => {
    try {
        const { orderId, rating, comment, category, source, userPhone } = req.body;

        // Verificar se o pedido existe
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se já existe feedback para este pedido
        const existingFeedback = await Feedback.findOne({ orderId });
        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: 'Feedback já foi enviado para este pedido'
            });
        }

        // Criar novo feedback
        const feedback = new Feedback({
            orderId,
            userId: order.user || null,
            customerName: order.customerName || 'Cliente',
            customerPhone: order.customerPhone || userPhone,
            rating,
            comment: comment || '',
            category: category || 'general',
            orderValue: order.total,
            deliveryTime: order.deliveredAt ? 
                Math.round((new Date(order.deliveredAt) - new Date(order.createdAt)) / (1000 * 60)) : null,
            status: 'pending',
            source: source || 'whatsapp' // Fonte do feedback
        });

        await feedback.save();

        // Atualizar o pedido com referência ao feedback
        await Order.findByIdAndUpdate(orderId, {
            $set: { 
                feedbackId: feedback._id, 
                feedbackReceived: true,
                surveyRespondedAt: new Date()
            }
        });

        systemLogger.business('feedback_received', {
            feedbackId: feedback._id,
            orderId,
            rating,
            category,
            source: source || 'whatsapp',
            customerPhone: order.customerPhone || userPhone
        });

        // Se o feedback for negativo (≤ 3), criar alerta
        if (rating <= 3) {
            systemLogger.warn('Negative feedback received', {
                feedbackId: feedback._id,
                orderId,
                rating,
                comment: comment?.substring(0, 100),
                customerPhone: order.customerPhone || userPhone,
                source: source || 'whatsapp'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Feedback recebido com sucesso',
            data: feedback
        });

    } catch (error) {
        systemLogger.error('Error creating feedback', {
            error: error.message,
            orderId: req.body.orderId,
            source: req.body.source
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Listar todos os feedbacks (admin)
const getAllFeedbacks = async (req, res) => {
    try {
        const { page = 1, limit = 20, rating, category, status, startDate, endDate } = req.query;

        // Construir filtro
        let filter = {};
        
        if (rating) {
            filter.rating = parseInt(rating);
        }
        
        if (category && category !== 'all') {
            filter.category = category;
        }
        
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const feedbacks = await Feedback.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('orderId', 'orderNumber total items');

        const total = await Feedback.countDocuments(filter);

        // Estatísticas dos feedbacks
        const stats = await Feedback.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalFeedbacks: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    },
                    negativeCount: {
                        $sum: { $cond: [{ $lte: ['$rating', 3] }, 1, 0] }
                    },
                    positiveCount: {
                        $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
                    }
                }
            }
        ]);

        const statistics = stats[0] || {
            totalFeedbacks: 0,
            averageRating: 0,
            negativeCount: 0,
            positiveCount: 0
        };

        // Calcular distribuição por estrelas
        const ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (statistics.ratingDistribution) {
            statistics.ratingDistribution.forEach(rating => {
                ratingCount[rating] = (ratingCount[rating] || 0) + 1;
            });
        }

        systemLogger.business('feedbacks_listed', {
            userId: req.user.id,
            totalResults: total,
            filters: { rating, category, status }
        });

        res.json({
            success: true,
            data: feedbacks,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            },
            statistics: {
                ...statistics,
                ratingDistribution: ratingCount,
                satisfactionRate: statistics.totalFeedbacks > 0 ? 
                    ((statistics.positiveCount / statistics.totalFeedbacks) * 100).toFixed(1) : 0
            }
        });

    } catch (error) {
        systemLogger.error('Error fetching feedbacks', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter feedback específico
const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;

       // const feedback = await Feedback.findById(id)
            query.populate('orderId', 'orderNumber total items customer createdAt deliveredAt')
            .populate('userId', 'name email phone');

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback não encontrado'
            });
        }

        res.json({
            success: true,
            data: feedback
        });

    } catch (error) {
        systemLogger.error('Error fetching feedback', {
            error: error.message,
            feedbackId: req.params.id,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Responder a um feedback
const respondToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { response, adminName } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback não encontrado'
            });
        }

        feedback.response = response;
        feedback.respondedBy = adminName || req.user.name;
        feedback.respondedAt = new Date();
        feedback.status = 'responded';

        await feedback.save();

        systemLogger.business('feedback_responded', {
            feedbackId: id,
            respondedBy: req.user.id,
            adminName: adminName || req.user.name,
            originalRating: feedback.rating
        });

        res.json({
            success: true,
            message: 'Resposta enviada com sucesso',
            data: feedback
        });

    } catch (error) {
        systemLogger.error('Error responding to feedback', {
            error: error.message,
            feedbackId: req.params.id,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter estatísticas de satisfação
const getSatisfactionStats = async (req, res) => {
    try {
        const { period = '30' } = req.query; // dias
        const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

        // Estatísticas gerais
        const generalStats = await Feedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalFeedbacks: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    averageDeliveryTime: { $avg: '$deliveryTime' },
                    totalOrderValue: { $sum: '$orderValue' }
                }
            }
        ]);

        // Distribuição por rating
        const ratingDistribution = await Feedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Tendência por dia
        const dailyTrend = await Feedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    averageRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Categorias com mais problemas
        const categoryIssues = await Feedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    rating: { $lte: 3 }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Feedbacks que precisam de atenção (não respondidos e negativos)
        const pendingNegative = await Feedback.countDocuments({
            createdAt: { $gte: startDate },
            rating: { $lte: 3 },
            status: 'pending'
        });

        res.json({
            success: true,
            data: {
                general: generalStats[0] || {
                    totalFeedbacks: 0,
                    averageRating: 0,
                    averageDeliveryTime: 0,
                    totalOrderValue: 0
                },
                ratingDistribution,
                dailyTrend,
                categoryIssues,
                alerts: {
                    pendingNegativeFeedbacks: pendingNegative
                }
            },
            period: parseInt(period)
        });

    } catch (error) {
        systemLogger.error('Error fetching satisfaction stats', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Buscar pedidos elegíveis para pesquisa de satisfação
const getEligibleOrdersForSurvey = async (req, res) => {
    try {
        // Pedidos entregues nas últimas 24h que ainda não receberam pesquisa
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const eligibleOrders = await Order.find({
            status: 'delivered',
            deliveredAt: { $gte: yesterday },
            feedbackReceived: { $ne: true }
        })
        .select('_id orderNumber customer.name customer.phone total deliveredAt')
        .sort({ deliveredAt: -1 });

        res.json({
            success: true,
            data: eligibleOrders,
            count: eligibleOrders.length
        });

    } catch (error) {
        systemLogger.error('Error fetching eligible orders', {
            error: error.message,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    createFeedback,
    getAllFeedbacks,
    getFeedbackById,
    respondToFeedback,
    getSatisfactionStats,
    getEligibleOrdersForSurvey
};
