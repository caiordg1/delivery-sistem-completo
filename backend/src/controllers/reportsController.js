const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { systemLogger } = require('../config/logger');

// Relatório de vendas por período
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] },
            createdAt: {
                $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            }
        };

        let groupBy;
        switch (period) {
            case 'hourly':
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                };
                break;
            case 'weekly':
                groupBy = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'monthly':
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            case 'yearly':
                groupBy = {
                    year: { $year: '$createdAt' }
                };
                break;
            default: // daily
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
        }

        const salesData = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' },
                    totalItems: { $sum: { $size: '$items' } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
        ]);

        // Calcular totais gerais
        const totals = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        systemLogger.business('sales_report_generated', {
            userId: req.user.id,
            period,
            startDate,
            endDate,
            recordsFound: salesData.length
        });

        res.json({
            success: true,
            data: salesData,
            totals: totals[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
            period,
            dateRange: { startDate, endDate }
        });

    } catch (error) {
        systemLogger.error('Error generating sales report', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Relatório de produtos mais vendidos
const getTopProductsReport = async (req, res) => {
    try {
        const { startDate, endDate, limit = 10 } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] },
            createdAt: {
                $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            }
        };

        const topProducts = await Order.aggregate([
            { $match: matchCondition },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    productName: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' },
                    averagePrice: { $avg: '$items.price' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: parseInt(limit) }
        ]);

        res.json({
            success: true,
            data: topProducts,
            period: { startDate, endDate },
            limit: parseInt(limit)
        });

    } catch (error) {
        systemLogger.error('Error generating top products report', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Relatório de horários de pico
const getPeakHoursReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] },
            createdAt: {
                $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            }
        };

        const peakHours = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Análise por dia da semana
        const dayOfWeekAnalysis = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Mapear números dos dias para nomes
        const dayNames = ['', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const formattedDayAnalysis = dayOfWeekAnalysis.map(day => ({
            ...day,
            dayName: dayNames[day._id]
        }));

        res.json({
            success: true,
            data: {
                hourlyAnalysis: peakHours,
                dayOfWeekAnalysis: formattedDayAnalysis
            },
            period: { startDate, endDate }
        });

    } catch (error) {
        systemLogger.error('Error generating peak hours report', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Relatório de cupons e descontos
const getCouponsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] },
            'couponUsed.code': { $exists: true },
            createdAt: {
                $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            }
        };

        const couponsUsage = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: '$couponUsed.code',
                    usageCount: { $sum: 1 },
                    totalDiscount: { $sum: '$couponUsed.discount' },
                    totalRevenue: { $sum: '$total' },
                    averageDiscount: { $avg: '$couponUsed.discount' }
                }
            },
            { $sort: { usageCount: -1 } }
        ]);

        // Estatísticas gerais de cupons
        const couponStats = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['delivered', 'confirmed'] },
                    createdAt: {
                        $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                        $lte: new Date(endDate || new Date())
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    ordersWithCoupon: {
                        $sum: {
                            $cond: [{ $exists: ['$couponUsed.code', true] }, 1, 0]
                        }
                    },
                    totalDiscountGiven: {
                        $sum: {
                            $cond: [{ $exists: ['$couponUsed.discount', true] }, '$couponUsed.discount', 0]
                        }
                    }
                }
            }
        ]);

        const stats = couponStats[0] || { totalOrders: 0, ordersWithCoupon: 0, totalDiscountGiven: 0 };
        stats.couponUsageRate = stats.totalOrders > 0 ? (stats.ordersWithCoupon / stats.totalOrders * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                couponsUsage,
                statistics: stats
            },
            period: { startDate, endDate }
        });

    } catch (error) {
        systemLogger.error('Error generating coupons report', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Relatório financeiro completo
const getFinancialSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] },
            createdAt: {
                $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                $lte: new Date(endDate || new Date())
            }
        };

        // Resumo financeiro principal
        const financialSummary = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' },
                    totalDeliveryFees: { $sum: '$deliveryFee' },
                    totalDiscounts: { $sum: '$couponUsed.discount' },
                    totalItems: { $sum: { $size: '$items' } }
                }
            }
        ]);

        // Crescimento comparado ao período anterior
        const previousPeriodStart = new Date(startDate || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
        const previousPeriodEnd = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

        const previousPeriodData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['delivered', 'confirmed'] },
                    createdAt: {
                        $gte: previousPeriodStart,
                        $lte: previousPeriodEnd
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const current = financialSummary[0] || { totalRevenue: 0, totalOrders: 0 };
        const previous = previousPeriodData[0] || { totalRevenue: 0, totalOrders: 0 };

        const growth = {
            revenueGrowth: previous.totalRevenue > 0 ? 
                (((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100).toFixed(2) : 0,
            orderGrowth: previous.totalOrders > 0 ? 
                (((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100).toFixed(2) : 0
        };

        res.json({
            success: true,
            data: {
                currentPeriod: current,
                previousPeriod: previous,
                growth,
                period: { startDate, endDate }
            }
        });

    } catch (error) {
        systemLogger.error('Error generating financial summary', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Relatório para contador (dados fiscais)
const getTaxReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let matchCondition = {
            status: { $in: ['delivered', 'confirmed'] }
        };

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            matchCondition.createdAt = { $gte: startDate, $lte: endDate };
        } else if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59);
            matchCondition.createdAt = { $gte: startDate, $lte: endDate };
        }

        const taxData = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    totalDeliveryFees: { $sum: '$deliveryFee' },
                    productRevenue: { $sum: '$subtotal' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = [
            '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const formattedData = taxData.map(item => ({
            ...item,
            monthName: monthNames[item._id.month],
            // Simulação de impostos (substitua pela lógica real)
            estimatedTaxes: {
                icms: (item.productRevenue * 0.18).toFixed(2),
                iss: (item.totalDeliveryFees * 0.05).toFixed(2),
                totalTax: (item.totalRevenue * 0.15).toFixed(2)
            }
        }));

        res.json({
            success: true,
            data: formattedData,
            period: { year, month }
        });

    } catch (error) {
        systemLogger.error('Error generating tax report', {
            error: error.message,
            userId: req.user.id
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSalesReport,
    getTopProductsReport,
    getPeakHoursReport,
    getCouponsReport,
    getFinancialSummary,
    getTaxReport
};
