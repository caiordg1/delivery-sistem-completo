// src/controllers/dashboardController.js

exports.getMetrics = async (req, res) => {
  try {
    // Aqui você pode puxar dados reais do banco
    // Por enquanto vamos simular algumas métricas básicas:

    const metrics = {
      totalOrders: 150,
      totalRevenue: 12000.50,
      totalUsers: 45,
      ordersPending: 5,
      ordersDelivered: 140,
      feedbackCount: 30
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar métricas.' });
  }
};
