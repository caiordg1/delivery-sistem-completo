const thermalPrinterService = require('../src/services/thermalPrinterService');
const PrintJob = require('../models/PrintJob');
const Order = require('../models/Order');
const logger = require('../config/logger');

// Status geral das impressoras
exports.getPrintersStatus = async (req, res) => {
    try {
        const status = await thermalPrinterService.getPrintersStatus();
        
        // Adicionar estatísticas recentes
        const stats = await PrintJob.getStats();
        
        const response = {
            enabled: process.env.THERMAL_PRINTING_ENABLED === 'true',
            printers: status,
            stats: stats,
            timestamp: new Date()
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        logger.error('Erro ao obter status das impressoras:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter status das impressoras',
            error: error.message
        });
    }
};

// Reimprimir pedido específico
exports.reprintOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { printer } = req.body; // Impressora específica (opcional)

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'ID do pedido é obrigatório'
            });
        }

        const result = await thermalPrinterService.reprintOrder(orderId, printer);

        // Log da ação
        logger.info('Reimpressão solicitada', {
            orderId,
            printer: printer || 'todas',
            user: req.user?.id,
            success: result.success
        });

        res.json({
            success: true,
            data: result,
            message: 'Reimpressão realizada'
        });

    } catch (error) {
        logger.error('Erro na reimpressão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na reimpressão',
            error: error.message
        });
    }
};

// Teste de impressão
exports.testPrint = async (req, res) => {
    try {
        const { printer } = req.params;

        if (!printer) {
            return res.status(400).json({
                success: false,
                message: 'Impressora é obrigatória'
            });
        }

        const result = await thermalPrinterService.testPrint(printer);

        logger.info('Teste de impressão executado', {
            printer,
            user: req.user?.id,
            success: result.success
        });

        res.json({
            success: true,
            data: result,
            message: `Teste de impressão enviado para ${printer}`
        });

    } catch (error) {
        logger.error('Erro no teste de impressão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no teste de impressão',
            error: error.message
        });
    }
};

// Histórico de impressões
exports.getPrintHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            printer,
            success,
            orderId,
            startDate,
            endDate
        } = req.query;

        // Construir filtros
        const filters = {};

        if (printer) filters.printer = printer;
        if (success !== undefined) filters.success = success === 'true';
        if (orderId) filters.orderId = orderId;

        if (startDate || endDate) {
            filters.timestamp = {};
            if (startDate) filters.timestamp.$gte = new Date(startDate);
            if (endDate) filters.timestamp.$lte = new Date(endDate);
        }

        // Buscar com paginação
        const skip = (page - 1) * limit;
        const printJobs = await PrintJob.find(filters)
            .populate('orderId', 'orderNumber customer.name total paymentStatus')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PrintJob.countDocuments(filters);

        res.json({
            success: true,
            data: {
                printJobs,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(total / limit),
                    count: printJobs.length,
                    totalRecords: total
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar histórico de impressões:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico',
            error: error.message
        });
    }
};

// Estatísticas de impressão
exports.getPrintStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias
        const end = endDate ? new Date(endDate) : new Date();

        // Estatísticas gerais
        const stats = await PrintJob.getStats(start, end);

        // Impressões por dia
        const dailyStats = await PrintJob.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        printer: "$printer"
                    },
                    total: { $sum: 1 },
                    successful: {
                        $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.day",
                    printers: {
                        $push: {
                            name: "$_id.printer",
                            total: "$total",
                            successful: "$successful"
                        }
                    },
                    totalDay: { $sum: "$total" },
                    successfulDay: { $sum: "$successful" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Horários de maior atividade
        const hourlyStats = await PrintJob.aggregate([
            {
                $match: {
                    timestamp: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                general: stats,
                daily: dailyStats,
                hourly: hourlyStats,
                period: { start, end }
            }
        });

    } catch (error) {
        logger.error('Erro ao calcular estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao calcular estatísticas',
            error: error.message
        });
    }
};

// Configurar impressora
exports.updatePrinterConfig = async (req, res) => {
    try {
        const { printer } = req.params;
        const config = req.body;

        const result = thermalPrinterService.updatePrinterConfig(printer, config);

        logger.info('Configuração de impressora atualizada', {
            printer,
            config,
            user: req.user?.id
        });

        res.json({
            success: true,
            message: `Configuração da impressora ${printer} atualizada`,
            data: result
        });

    } catch (error) {
        logger.error('Erro ao atualizar configuração:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar configuração',
            error: error.message
        });
    }
};

// Imprimir pedido manualmente
exports.printOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { printers } = req.body; // Array de impressoras específicas (opcional)

        const order = await Order.findById(orderId).populate('items.product customer');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        let result;
        if (printers && printers.length > 0) {
            // Imprimir em impressoras específicas
            const results = [];
            for (const printer of printers) {
                const printResult = await thermalPrinterService.printToSpecificPrinter(printer, order);
                results.push({ printer, ...printResult });
            }
            result = {
                success: results.some(r => r.success),
                results,
                message: `Impressão enviada para ${results.length} impressora(s)`
            };
        } else {
            // Imprimir automático baseado nos itens
            result = await thermalPrinterService.printOrder(order);
        }

        logger.info('Impressão manual solicitada', {
            orderId,
            printers: printers || 'automatico',
            user: req.user?.id,
            success: result.success
        });

        res.json({
            success: true,
            data: result,
            message: 'Impressão realizada'
        });

    } catch (error) {
        logger.error('Erro na impressão manual:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na impressão',
            error: error.message
        });
    }
};

// Limpar logs antigos
exports.cleanOldLogs = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const result = await PrintJob.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        logger.info('Limpeza de logs de impressão executada', {
            days,
            deleted: result.deletedCount,
            user: req.user?.id
        });

        res.json({
            success: true,
            message: `${result.deletedCount} logs antigos removidos`,
            data: {
                deleted: result.deletedCount,
                cutoffDate
            }
        });

    } catch (error) {
        logger.error('Erro na limpeza de logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na limpeza de logs',
            error: error.message
        });
    }
};

// Histórico de impressões de um pedido específico
exports.getOrderPrintHistory = async (req, res) => {
    try {
        const { orderId } = req.params;

        const printHistory = await PrintJob.getOrderPrintHistory(orderId);

        res.json({
            success: true,
            data: printHistory
        });

    } catch (error) {
        logger.error('Erro ao buscar histórico do pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico do pedido',
            error: error.message
        });
    }
};
