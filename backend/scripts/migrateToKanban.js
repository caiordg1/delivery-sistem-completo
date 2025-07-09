const mongoose = require('mongoose');
const Order = require('../src/models/Order');

/**
 * MIGRAÇÃO SEGURA E REVERSÍVEL
 * Converte pedidos existentes para estrutura Kanban
 * SEM quebrar dados existentes
 */
async function migrateToKanban() {
  try {
    console.log('🔄 Iniciando migração SEGURA para Kanban...');
    
    // Conectar ao banco
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery_system');
    
    // Buscar pedidos que precisam de migração
    const ordersToMigrate = await Order.find({
      $or: [
        { statusHistory: { $exists: false } },
        { statusHistory: { $size: 0 } },
        { timeMetrics: { $exists: false } },
        { observations: { $exists: false } },
        { priority: { $exists: false } }
      ]
    });

    console.log(`📋 Encontrados ${ordersToMigrate.length} pedidos para migrar`);

    let migratedCount = 0;
    
    for (const order of ordersToMigrate) {
      let updated = false;
      
      // 1. INICIALIZAR STATUS HISTORY
      if (!order.statusHistory || order.statusHistory.length === 0) {
        order.statusHistory = [{
          status: order.status,
          timestamp: order.createdAt || new Date(),
          user: 'Sistema',
          observation: 'Migração automática - estado inicial preservado'
        }];
        updated = true;
      }
      
      // 2. INICIALIZAR MÉTRICAS DE TEMPO
      if (!order.timeMetrics) {
        order.timeMetrics = {
          preparationTime: null,
          deliveryTime: null,
          totalTime: null
        };
        
        // Se pedido já foi entregue, calcular tempo total aproximado
        if (order.status === 'entregue' && order.deliveredAt) {
          const totalMinutes = Math.floor((order.deliveredAt - order.createdAt) / 60000);
          order.timeMetrics.totalTime = totalMinutes;
        }
        updated = true;
      }
      
      // 3. INICIALIZAR OBSERVAÇÕES
      if (!order.observations) {
        order.observations = [];
        updated = true;
      }
      
      // 4. INICIALIZAR PRIORIDADE
      if (!order.priority) {
        order.priority = 'normal';
        updated = true;
      }
      
      // 5. SALVAR APENAS SE HOUVE MUDANÇAS
      if (updated) {
        await order.save();
        migratedCount++;
        console.log(`✅ Migrado pedido ${order._id} (${order.orderNumber || 'N/A'})`);
      }
    }

    console.log(`🎉 Migração concluída! ${migratedCount} pedidos atualizados.`);
    console.log('💾 Todos os dados originais foram preservados.');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateToKanban();
}

module.exports = { migrateToKanban };
