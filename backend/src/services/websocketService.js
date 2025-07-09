const { Server } = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  // ✅ Inicializar WebSocket Server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket Server iniciado com sucesso');
    
    return this.io;
  }

  // ✅ Configurar eventos de conexão
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Cliente conectado: ${socket.id}`);
      
      // Armazenar informações do cliente
      this.connectedClients.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date(),
        isAdmin: false,
        userId: null
      });

      // ✅ Evento: Admin entrando na sala
      socket.on('join-admin', (userId) => {
        socket.join('admin-room');
        
        // Atualizar informações do cliente
        if (this.connectedClients.has(socket.id)) {
          this.connectedClients.set(socket.id, {
            ...this.connectedClients.get(socket.id),
            isAdmin: true,
            userId: userId || 'admin'
          });
        }
        
        console.log(`👑 Admin ${userId || 'desconhecido'} entrou na sala (${socket.id})`);
        
        // Notificar outros admins
        socket.to('admin-room').emit('admin-joined', {
          userId: userId || 'admin',
          socketId: socket.id,
          timestamp: new Date()
        });

        // Enviar estatísticas iniciais
        this.sendConnectionStats();
      });

      // ✅ Evento: Cliente solicitando dados
      socket.on('request-kanban-data', () => {
        console.log(`📊 Cliente ${socket.id} solicitou dados do Kanban`);
        socket.emit('kanban-data-requested', {
          message: 'Dados solicitados, atualize via API',
          timestamp: new Date()
        });
      });

      // ✅ Evento: Ping/Pong para manter conexão
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // ✅ Evento: Desconexão
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id} - Motivo: ${reason}`);
        
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo && clientInfo.isAdmin) {
          socket.to('admin-room').emit('admin-left', {
            userId: clientInfo.userId,
            socketId: socket.id,
            reason: reason,
            timestamp: new Date()
          });
        }
        
        this.connectedClients.delete(socket.id);
        this.sendConnectionStats();
      });

      // ✅ Evento: Erro de conexão
      socket.on('error', (error) => {
        console.error(`❌ Erro WebSocket (${socket.id}):`, error);
      });

      // Enviar estatísticas atualizadas
      this.sendConnectionStats();
    });
  }

  // ✅ Emitir novo pedido para admins
  emitNewOrder(order) {
    if (!this.io) return;

    const orderData = {
      _id: order._id,
      orderNumber: order.orderNumber || order._id?.slice(-6) || 'N/A',
      customerName: order.customerName || 'Cliente',
      customerPhone: order.customerPhone,
      total: order.total,
      status: order.status,
      items: order.items || [],
      createdAt: order.createdAt || new Date(),
      timestamp: new Date()
    };

    console.log(`📤 Emitindo novo pedido: ${orderData.orderNumber}`);
    
    this.io.to('admin-room').emit('new-order', orderData);

    // Estatísticas
    this.logEmissionStats('new-order', orderData.orderNumber);
  }

  // ✅ Emitir mudança de status
  emitStatusChange(orderId, oldStatus, newStatus, user = 'Sistema') {
    if (!this.io) return;

    const statusData = {
      orderId,
      oldStatus,
      newStatus,
      user,
      timestamp: new Date()
    };

    console.log(`📤 Emitindo mudança status: ${orderId.slice(-6)} (${oldStatus} → ${newStatus})`);
    
    this.io.to('admin-room').emit('status-changed', statusData);

    // Estatísticas
    this.logEmissionStats('status-changed', `${orderId.slice(-6)}: ${oldStatus}→${newStatus}`);
  }

  // ✅ Emitir nova observação
  emitNewObservation(orderId, observation) {
    if (!this.io) return;

    const observationData = {
      orderId,
      observation: {
        text: observation.text,
        user: observation.user,
        type: observation.type || 'info',
        timestamp: observation.timestamp || new Date()
      },
      timestamp: new Date()
    };

    console.log(`📤 Emitindo nova observação: ${orderId.slice(-6)}`);
    
    this.io.to('admin-room').emit('new-observation', observationData);

    // Estatísticas
    this.logEmissionStats('new-observation', orderId.slice(-6));
  }

  // ✅ Emitir alerta de pedido
  emitOrderAlert(alert) {
    if (!this.io) return;

    const alertData = {
      type: alert.type || 'warning',
      orderId: alert.orderId,
      orderNumber: alert.orderNumber,
      customerName: alert.customerName,
      message: alert.message,
      minutesElapsed: alert.minutesElapsed,
      priority: alert.priority || 'normal',
      timestamp: new Date()
    };

    console.log(`📤 Emitindo alerta: ${alert.type} - ${alert.message}`);
    
    this.io.to('admin-room').emit('order-alert', alertData);

    // Estatísticas
    this.logEmissionStats('order-alert', alert.type);
  }

  // ✅ Broadcast geral para todos os clientes
  broadcast(event, data) {
    if (!this.io) return;

    console.log(`📡 Broadcast: ${event}`);
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // ✅ Enviar estatísticas de conexão
  sendConnectionStats() {
    if (!this.io) return;

    const stats = {
      totalConnected: this.connectedClients.size,
      adminsConnected: Array.from(this.connectedClients.values()).filter(client => client.isAdmin).length,
      connections: Array.from(this.connectedClients.values()).map(client => ({
        socketId: client.socketId.slice(-6),
        isAdmin: client.isAdmin,
        userId: client.userId,
        connectedAt: client.connectedAt
      })),
      timestamp: new Date()
    };

    this.io.to('admin-room').emit('connection-stats', stats);
  }

  // ✅ Log de estatísticas de emissão
  logEmissionStats(event, details) {
    const adminsCount = Array.from(this.connectedClients.values()).filter(client => client.isAdmin).length;
    console.log(`📊 Evento '${event}' enviado para ${adminsCount} admin(s) - ${details}`);
  }

  // ✅ Verificar se WebSocket está ativo
  isActive() {
    return this.io !== null;
  }

  // ✅ Obter estatísticas do servidor
  getStats() {
    return {
      isActive: this.isActive(),
      totalConnections: this.connectedClients.size,
      adminConnections: Array.from(this.connectedClients.values()).filter(client => client.isAdmin).length,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  // ✅ Shutdown gracioso
  shutdown() {
    if (this.io) {
      console.log('🔌 Encerrando WebSocket Server...');
      this.io.close();
      this.io = null;
      this.connectedClients.clear();
    }
  }
}

// Singleton pattern
const webSocketService = new WebSocketService();

module.exports = webSocketService;
