const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Criar pasta de logs se não existir
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Formato personalizado para os logs
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Configuração dos transportes (onde os logs serão salvos)
const transports = [
    // Console (desenvolvimento)
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: consoleFormat
    }),

    // Arquivo combinado (todos os logs)
    new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
        format: logFormat
    }),

    // Arquivo de erros
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: logFormat
    }),

    // Arquivo de acessos/requests
    new DailyRotateFile({
        filename: path.join(logDir, 'access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        level: 'http',
        format: logFormat
    }),

    // Arquivo de autenticação
    new DailyRotateFile({
        filename: path.join(logDir, 'auth-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '30d',
        level: 'info',
        format: logFormat
    })
];

// Criar o logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'delivery-system',
        environment: process.env.NODE_ENV || 'development'
    },
    transports,
    // Não sair do processo em caso de erro
    exitOnError: false
});

// Níveis customizados para diferentes tipos de log
const levels = {
    error: 0,    // Erros críticos
    warn: 1,     // Avisos importantes
    info: 2,     // Informações gerais
    http: 3,     // Requests HTTP
    debug: 4     // Informações de debug
};

// Adicionar cores aos níveis
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan'
});

// Funções específicas para diferentes tipos de log
const systemLogger = {
    // Log de erros
    error: (message, meta = {}) => {
        logger.error(message, {
            type: 'system_error',
            timestamp: new Date().toISOString(),
            ...meta
        });
    },

    // Log de avisos
    warn: (message, meta = {}) => {
        logger.warn(message, {
            type: 'system_warning',
            timestamp: new Date().toISOString(),
            ...meta
        });
    },

    // Log de informações
    info: (message, meta = {}) => {
        logger.info(message, {
            type: 'system_info',
            timestamp: new Date().toISOString(),
            ...meta
        });
    },

    // Log de requests HTTP
    http: (req, res, responseTime) => {
        logger.http('HTTP Request', {
            type: 'http_request',
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            userId: req.user ? req.user.id : null
        });
    },

    // Log de autenticação
    auth: (action, userId, meta = {}) => {
        logger.info('Authentication Event', {
            type: 'auth_event',
            action, // 'login', 'logout', 'register', 'failed_login'
            userId,
            timestamp: new Date().toISOString(),
            ...meta
        });
    },

    // Log de operações de negócio
    business: (action, data = {}) => {
        logger.info('Business Operation', {
            type: 'business_operation',
            action, // 'order_created', 'payment_processed', 'product_added'
            timestamp: new Date().toISOString(),
            ...data
        });
    },

    // Log de debug
    debug: (message, meta = {}) => {
        logger.debug(message, {
            type: 'debug',
            timestamp: new Date().toISOString(),
            ...meta
        });
    }
};

module.exports = {
    logger,
    systemLogger
};
