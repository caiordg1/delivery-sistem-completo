const { systemLogger } = require('../config/logger');

// Middleware para log de requisições HTTP
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Interceptar o final da resposta
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log da requisição
        systemLogger.http(req, res, responseTime);
        
        // Chamar o método original
        originalSend.call(this, data);
    };

    next();
};

// Middleware para log de erros
const errorLogger = (error, req, res, next) => {
    // Log do erro
    systemLogger.error('Request Error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user.id : null,
        body: req.body,
        params: req.params,
        query: req.query
    });

    next(error);
};

// Middleware para log de autenticação
const authLogger = (action) => {
    return (req, res, next) => {
        // Interceptar resposta de sucesso
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                systemLogger.auth(action, req.user ? req.user.id : req.body.email, {
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    success: true
                });
            } else {
                systemLogger.auth(`${action}_failed`, req.body.email || 'unknown', {
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: data.message || 'Authentication failed'
                });
            }
            
            originalJson.call(this, data);
        };

        next();
    };
};

// Middleware para log de operações de negócio
const businessLogger = (operation) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let logData = {
                    userId: req.user ? req.user.id : null,
                    ip: req.ip || req.connection.remoteAddress
                };

                // Adicionar dados específicos da operação
                switch (operation) {
                    case 'order_created':
                        logData.orderId = data.id || data._id;
                        logData.total = data.total;
                        logData.itemsCount = data.items ? data.items.length : 0;
                        break;
                    case 'payment_processed':
                        logData.orderId = req.params.orderId;
                        logData.method = req.body.method;
                        logData.amount = data.amount;
                        break;
                    case 'product_created':
                        logData.productId = data.id || data._id;
                        logData.productName = data.name;
                        logData.price = data.price;
                        break;
                    case 'coupon_used':
                        logData.couponCode = req.body.code;
                        logData.discount = data.discount;
                        break;
                    case 'loyalty_points_added':
                        logData.points = req.body.points;
                        logData.targetUserId = req.body.userId;
                        break;
                }

                systemLogger.business(operation, logData);
            }
            
            originalJson.call(this, data);
        };

        next();
    };
};

module.exports = {
    requestLogger,
    errorLogger,
    authLogger,
    businessLogger
};
