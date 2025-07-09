const thermalPrinterService = require('../services/thermalPrinterService');
const Order = require('../models/Order');
const satisfactionTrigger = require('../services/satisfactionTriggerService');

// ✅ FUNÇÃO ORIGINAL PRESERVADA - Criar novo pedido
exports.createOrder = async (req, res) => {
  try {
    const { items, total, customerName, customerPhone, customerAddress, paymentMethod } = req.body;
    
    const orderData = {
      items,
      total,
      customerName,
      customerPhone, 
      customerAddress,
      paymentMethod
    };
    
    // Se há usuário logado, adicionar
    if (req.user && req.user.userId) {
      orderData.user = req.user.userId;
    }
    
    const newOrder = new Order(orderData);
    await newOrder.save();
    
    // ✅ IMPRESSÃO TÉRMICA PRESERVADA
    try {
      await thermalPrinterService.printOrder(newOrder);
    } catch (printError) {
      console.warn('Erro na impressão automática:', printError);
    }

    // 🆕 WEBSOCKET ATUALIZADO - Emitir novo pedido
    if (global.webSocketService && global.webSocketService.isActive()) {
      global.webSocketService.emitNewOrder(newOrder);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Pedido criado com sucesso!', 
      _id: newOrder._id, 
      order: newOrder 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar pedido.', error: err.message });
  }
};

// ✅ FUNÇÃO ORIGINAL PRESERVADA - Listar todos os pedidos
exports.getOrders = async (req, res) => {
  try {
    let query = {};
    
    // Se há usuário logado, filtrar por usuário
    if (req.user && req.user.userId) {
      query.user = req.user.userId;
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.', error: err.message });
  }
};

// ✅ FUNÇÃO ORIGINAL PRESERVADA - Buscar por ID
exports.getOrderById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Se há usuário logado, filtrar por usuário
    if (req.user && req.user.userId) {
      query.user = req.user.userId;
    }
    
    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedido.', error: err.message });
  }
};

// ✅ FUNÇÃO ORIGINAL PRESERVADA - Atualizar pedido
exports.updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    
    let query = { _id: req.params.id };
    if (req.user && req.user.userId) {
      query.user = req.user.userId;
    }
    
    const updateData = { 
      status, 
      ...(status === 'entregue' ? { deliveredAt: new Date() } : {}) 
    };
    
    const updated = await Order.findOneAndUpdate(query, updateData, { new: true });
    
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado.' });
    
    // ✅ SISTEMA DE SATISFAÇÃO PRESERVADO
    if (status === 'entregue') {
      try {
        await satisfactionTrigger.triggerSatisfactionSurvey(updated._id);
        console.log(`🎯 Pesquisa de satisfação agendada para o pedido ${updated._id}`);
      } catch (error) {
        console.error('❌ Erro ao agendar pesquisa de satisfação:', error);
      }
    }
    
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar pedido.', error: err.message });
  }
};

// ✅ FUNÇÃO ORIGINAL PRESERVADA - Deletar pedido
exports.deleteOrder = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user && req.user.userId) {
      query.user = req.user.userId;
    }
    
    const deleted = await Order.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.status(200).json({ message: 'Pedido deletado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar pedido.', error: err.message });
  }
};

// 🆕 FUNÇÃO KANBAN - Dados agrupados por status
exports.getKanbanData = async (req, res) => {
  try {
    const today = new Date();
    //today.setHours(0, 0, 0, 0);

    // Buscar pedidos do dia (exceto cancelados)
    const orders = await Order.find({
      //createdAt: { $gte: today },
      status: { $ne: 'cancelado' }
    }).sort({ createdAt: -1 });

    // Agrupar por status com compatibilidade
    const kanbanData = {
      recebido: [],
      em_preparo: [],
      aguardando_entregador: [],
      saiu_para_entrega: [],
      entregue: []
    };

    orders.forEach(order => {
      const status = order.status;
      
      // Compatibilidade: 'pendente' vai para coluna 'recebido' no Kanban
      if (status === 'pendente') {
        kanbanData.recebido.push(order);
      } else if (kanbanData[status]) {
        kanbanData[status].push(order);
      }
    });

    res.json(kanbanData);

  } catch (error) {
    console.error('Erro ao buscar dados do Kanban:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Atualização de status avançada COM WEBSOCKET
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observation, user } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const oldStatus = order.status;

    // Validação de transições compatível com sistema atual
    const validTransitions = {
      pendente: ['recebido', 'cancelado'],
      recebido: ['em_preparo', 'cancelado'],
      em_preparo: ['aguardando_entregador', 'cancelado'],
      aguardando_entregador: ['saiu_para_entrega', 'cancelado'],
      saiu_para_entrega: ['entregue', 'cancelado'],
      entregue: [],
      cancelado: []
    };

    if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(status)) {
      return res.status(400).json({ 
        error: `Transição inválida de ${oldStatus} para ${status}` 
      });
    }

    // Atualizar status
    order.status = status;
    
    // Adicionar ao histórico
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      user: user || 'Sistema',
      observation: observation || `Status alterado para ${status}`
    });

    // Calcular métricas de tempo
    const now = new Date();
    
    if (status === 'em_preparo' && !order.kitchenStartTime) {
      order.kitchenStartTime = now;
    }
    
    if (status === 'saiu_para_entrega' && !order.deliveryStartTime) {
      order.deliveryStartTime = now;
      if (order.kitchenStartTime) {
        order.timeMetrics.preparationTime = Math.floor((now - order.kitchenStartTime) / 60000);
      }
    }
    
    if (status === 'entregue') {
      order.deliveredAt = now; // ✅ PRESERVAR para sistema de satisfação
      
      if (order.deliveryStartTime) {
        order.timeMetrics.deliveryTime = Math.floor((now - order.deliveryStartTime) / 60000);
      }
      order.timeMetrics.totalTime = Math.floor((now - order.createdAt) / 60000);
      
      // ✅ MANTER INTEGRAÇÃO COM SISTEMA DE SATISFAÇÃO
      try {
        await satisfactionTrigger.triggerSatisfactionSurvey(order._id);
      } catch (error) {
        console.log('Sistema de satisfação não encontrado ou erro:', error.message);
      }
    }

    await order.save();

    // 🆕 WEBSOCKET ATUALIZADO - Emitir mudança de status
    if (global.webSocketService && global.webSocketService.isActive()) {
      global.webSocketService.emitStatusChange(id, oldStatus, status, user);
    }

    res.json({ 
      success: true, 
      order,
      message: `Status alterado de ${oldStatus} para ${status}` 
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Adicionar observação COM WEBSOCKET
exports.addObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, user, type = 'info' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const observation = {
      text,
      user,
      type,
      timestamp: new Date()
    };

    order.observations.push(observation);
    await order.save();

    // 🆕 WEBSOCKET ATUALIZADO - Emitir nova observação
    if (global.webSocketService && global.webSocketService.isActive()) {
      global.webSocketService.emitNewObservation(id, observation);
    }

    res.json({ success: true, observation });

  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Buscar observações
exports.getObservations = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).select('observations');
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(order.observations || []);

  } catch (error) {
    console.error('Erro ao buscar observações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Histórico do pedido
exports.getOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).select('statusHistory');
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(order.statusHistory || []);

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Métricas operacionais COM ALERTAS
exports.getOrderMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: today } })

    const metrics = {
      totalOrders: orders.length,
      completedToday: orders.filter(o => o.status === 'entregue').length,
      delayedOrders: 0,
      averageTime: 0,
      statusTimes: []
    };

    // Calcular pedidos atrasados (mais de 60 minutos)
    const now = new Date();
    const delayedOrders = orders.filter(order => {
      if (order.status === 'entregue' || order.status === 'cancelado') return false;
      const minutesElapsed = Math.floor((now - order.createdAt) / 60000);
      return minutesElapsed > 60;
    });
    
    metrics.delayedOrders = delayedOrders.length;

    // 🆕 WEBSOCKET - Emitir alertas para pedidos atrasados
    if (delayedOrders.length > 0 && global.webSocketService && global.webSocketService.isActive()) {
      delayedOrders.forEach(order => {
        const minutesElapsed = Math.floor((now - order.createdAt) / 60000);
        global.webSocketService.emitOrderAlert({
          type: 'delayed',
          orderId: order._id,
          orderNumber: order.orderNumber || order._id.slice(-6),
          customerName: order.customerName,
          message: `Pedido #${order.orderNumber || order._id.slice(-6)} atrasado (${minutesElapsed}min)`,
          minutesElapsed,
          priority: minutesElapsed > 90 ? 'high' : 'normal'
        });
      });
    }

    // Calcular tempo médio dos pedidos entregues
    const deliveredOrders = orders.filter(o => 
      o.status === 'entregue' && o.timeMetrics?.totalTime
    );
    
    if (deliveredOrders.length > 0) {
      const totalTime = deliveredOrders.reduce((sum, order) => 
        sum + order.timeMetrics.totalTime, 0
      );
      metrics.averageTime = Math.round(totalTime / deliveredOrders.length);
    }

    res.json(metrics);

  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// 🆕 FUNÇÃO KANBAN - Alertas de pedidos
exports.getOrderAlerts = async (req, res) => {
  try {
    const now = new Date();
    const alerts = [];

    // Pedidos atrasados (mais de 60 minutos)
    const delayedOrders = await Order.find({
      status: { $nin: ['entregue', 'cancelado'] },
      createdAt: { $lt: new Date(now - 60 * 60 * 1000) }
    });

    delayedOrders.forEach(order => {
      const minutesElapsed = Math.floor((now - order.createdAt) / 60000);
      alerts.push({
        type: 'delayed',
        orderId: order._id,
        orderNumber: order.orderNumber || order._id.slice(-6),
        customerName: order.customerName,
        minutesElapsed,
        message: `Pedido #${order.orderNumber || order._id.slice(-6)} atrasado (${minutesElapsed}min)`
      });
    });

    // Pedidos urgentes
    const urgentOrders = await Order.find({
      priority: 'urgente',
      status: { $nin: ['entregue', 'cancelado'] }
    });

    urgentOrders.forEach(order => {
      alerts.push({
        type: 'urgent',
        orderId: order._id,
        orderNumber: order.orderNumber || order._id.slice(-6),
        customerName: order.customerName,
        message: `Pedido URGENTE #${order.orderNumber || order._id.slice(-6)} - ${order.customerName}`
      });
    });

    res.json(alerts);

  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
