const express = require('express');
const router = express.Router();

// Simulação de modelo Order (já que não temos MongoDB real configurado)
const Order = {
  create: async (orderData) => {
    const order = {
      _id: 'order_' + Date.now(),
      ...orderData,
      status: 'pending',
      createdAt: new Date()
    };
    console.log('✅ Pedido criado:', order);
    return order;
  },
  
  findById: async (id) => {
    return {
      _id: id,
      status: 'pending'
    };
  },
  
  findByIdAndUpdate: async (id, updateData) => {
    console.log('✅ Atualizando pedido:', id, updateData);
    return {
      _id: id,
      ...updateData
    };
  }
};

// CRIAR NOVO PEDIDO
router.post('/', async (req, res) => {
  try {
    console.log('📥 Recebido pedido:', req.body);
    
    const { customerName, customerPhone, customerAddress, items, total, paymentMethod } = req.body;

    // Validações
    if (!customerName || !customerPhone || !customerAddress || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios faltando'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens do pedido são obrigatórios'
      });
    }

    // Criar pedido
    const orderData = {
      customerName,
      customerPhone,
      customerAddress,
      items,
      total: parseFloat(total),
      paymentMethod: paymentMethod || 'whatsapp'
    };

    const order = await Order.create(orderData);

    console.log('✅ Pedido criado com sucesso:', order._id);

    res.json({
      success: true,
      _id: order._id,
      order: order
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// BUSCAR PEDIDO POR ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// LISTAR PEDIDOS
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      orders: []
    });
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
