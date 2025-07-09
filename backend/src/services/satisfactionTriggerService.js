const axios = require('axios');
const Order = require('../models/Order');

class SatisfactionTriggerService {
    constructor() {
        this.BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || 'http://localhost:3001/webhook/satisfaction';
        this.pendingSurveys = new Map();
    }

    // Chamado quando pedido muda para "entregue"
    async triggerSatisfactionSurvey(orderId) {
        try {
            console.log(`🔔 Trigger satisfação para pedido: ${orderId}`);
            
            // Buscar dados do pedido
            const order = await Order.findById(orderId).populate('user');
            if (!order) {
                console.error('Pedido não encontrado:', orderId);
                return false;
            }

            // Verificar se já foi enviada pesquisa
            if (order.surveyRequested) {
                console.log('Pesquisa já foi enviada para este pedido');
                return false;
            }

            // Agendar envio da pesquisa (30 minutos)
            const delay = 30 * 60 * 1000; // 30 minutos em ms
            
            setTimeout(async () => {
                await this.sendSatisfactionSurvey(orderId);
            }, delay);

            // Marcar como agendado
            await Order.findByIdAndUpdate(orderId, { 
                surveyRequested: true,
                surveyScheduledAt: new Date()
            });

            console.log(`📅 Pesquisa agendada para ${new Date(Date.now() + delay)}`);
            return true;

        } catch (error) {
            console.error('Erro no trigger de satisfação:', error);
            return false;
        }
    }

    // Enviar pesquisa de satisfação
    async sendSatisfactionSurvey(orderId) {
        try {
            console.log(`📤 Enviando pesquisa para pedido: ${orderId}`);

            const order = await Order.findById(orderId).populate('user');
            if (!order) {
                console.error('Pedido não encontrado na hora do envio:', orderId);
                return false;
            }

            // Verificar se não passou muito tempo (7 dias)
            const deliveredAt = new Date(order.deliveredAt);
            const now = new Date();
            const daysDiff = (now - deliveredAt) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 7) {
                console.log('Pedido muito antigo, não enviando pesquisa');
                return false;
            }

            // Preparar dados para o bot
            const surveyData = {
                userPhone: order.customerPhone,
                orderId: order._id,
                orderNumber: order.orderNumber,
                items: this.formatOrderItems(order.items),
                customerName: order.customerName
            };

            // Enviar para o bot WhatsApp
            const success = await this.sendToWhatsApp(surveyData);
            
            if (success) {
                await Order.findByIdAndUpdate(orderId, { 
                    surveySentAt: new Date()
                });
                console.log(`✅ Pesquisa enviada com sucesso para ${order.customerPhone}`);
            }

            return success;

        } catch (error) {
            console.error('Erro ao enviar pesquisa:', error);
            return false;
        }
    }

    // Enviar dados para o bot WhatsApp
    async sendToWhatsApp(surveyData) {
        try {
            // Se temos acesso direto ao bot (mesmo servidor)
            if (global.whatsappSock && global.satisfactionFlow) {
                const chatId = `${surveyData.userPhone}@s.whatsapp.net`;
                
                return await global.satisfactionFlow.startSatisfaction(
                    global.whatsappSock,
                    chatId,
                    surveyData,
                    surveyData.userPhone
                );
            }

            // Fallback: webhook (caso bot esteja em servidor separado)
            const response = await axios.post(this.BOT_WEBHOOK_URL, surveyData);
            return response.status === 200;

        } catch (error) {
            console.error('Erro ao comunicar com bot WhatsApp:', error);
            return false;
        }
    }

    formatOrderItems(items) {
        return items.map(item => 
            `${item.quantity}x ${item.name}${item.observation ? ` (${item.observation})` : ''}`
        ).join('\n');
    }

    // Método para processar pesquisas pendentes (cron job)
    async processPendingSurveys() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setMinutes(cutoffDate.getMinutes() - 30);

            const eligibleOrders = await Order.find({
                status: 'entregue',
                deliveredAt: { $lte: cutoffDate, $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                surveyRequested: { $ne: true },
                surveySentAt: { $exists: false }
            });

            console.log(`🔍 Encontrados ${eligibleOrders.length} pedidos elegíveis para pesquisa`);

            for (const order of eligibleOrders) {
                await this.sendSatisfactionSurvey(order._id);
                // Pequeno delay entre envios
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.error('Erro ao processar pesquisas pendentes:', error);
        }
    }
}

module.exports = new SatisfactionTriggerService();
