const axios = require('axios');

class SatisfactionService {
    constructor() {
        this.API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
    }

    async getEligibleOrders() {
        try {
            const response = await axios.get(`${this.API_BASE}/satisfaction/eligible-orders`);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar pedidos elegíveis:', error);
            return [];
        }
    }

    async markSurveyAsSent(orderId) {
        try {
            const response = await axios.patch(`${this.API_BASE}/satisfaction/mark-sent/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao marcar pesquisa como enviada:', error);
            return false;
        }
    }

    async createFeedback(feedbackData) {
        try {
            const response = await axios.post(`${this.API_BASE}/satisfaction/feedback`, feedbackData);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar feedback:', error);
            return null;
        }
    }

    formatOrderItems(items) {
        return items.map(item => `• ${item.quantity}x ${item.name}`).join('\n');
    }

    shouldSendSurvey(order) {
        // Verificar se já passou 30 minutos desde a entrega
        const deliveredAt = new Date(order.deliveredAt);
        const now = new Date();
        const diffMinutes = (now - deliveredAt) / (1000 * 60);
        
        // Verificar se não passou mais de 7 dias
        const diffDays = diffMinutes / (60 * 24);
        
        return diffMinutes >= 30 && diffDays <= 7 && !order.surveyRequested;
    }
}

module.exports = SatisfactionService;
