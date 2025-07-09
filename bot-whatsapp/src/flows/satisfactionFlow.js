const axios = require('axios');

class SatisfactionFlow {
    constructor() {
        this.userStates = new Map();
        this.API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
    }

    async handleSatisfactionFlow(sock, from, message, userPhone) {
        const userState = this.userStates.get(userPhone);

        if (!userState) {
            return false; // Não é um fluxo de satisfação
        }

        try {
            if (userState.step === 'waiting_rating') {
                return await this.handleRating(sock, from, message, userPhone);
            } else if (userState.step === 'waiting_comment') {
                return await this.handleComment(sock, from, message, userPhone);
            }
        } catch (error) {
            console.error('Erro no fluxo de satisfação:', error);
            await this.sendMessage(sock, from, 'Ops! Algo deu errado. Tente novamente mais tarde.');
            this.userStates.delete(userPhone);
        }

        return false;
    }

    async startSatisfaction(sock, from, orderData, userPhone) {
        try {
            const message = `Olá! Como foi seu pedido #${orderData.orderNumber}?\n\n` +
                           `📋 *Itens do pedido:*\n${orderData.items}\n\n` +
                           `⭐ *Avalie de 1 a 5 estrelas:*\n` +
                           `1 = Péssimo\n2 = Ruim\n3 = Regular\n4 = Bom\n5 = Excelente\n\n` +
                           `Digite apenas o número (1, 2, 3, 4 ou 5):`;

            await this.sendMessage(sock, from, message);

            this.userStates.set(userPhone, {
                step: 'waiting_rating',
                orderId: orderData.orderId,
                orderNumber: orderData.orderNumber,
                startedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error('Erro ao iniciar satisfação:', error);
            return false;
        }
    }

    async handleRating(sock, from, message, userPhone) {
        const rating = parseInt(message.trim());

        if (isNaN(rating) || rating < 1 || rating > 5) {
            await this.sendMessage(sock, from, 'Por favor, digite apenas um número de 1 a 5 para avaliar.');
            return true;
        }

        const userState = this.userStates.get(userPhone);
        userState.rating = rating;
        userState.step = 'waiting_comment';

        const ratingText = this.getRatingText(rating);
        const message2 = `Obrigado! Você avaliou com ${rating} estrelas (${ratingText}).\n\n` +
                        `💬 Quer nos contar mais sobre sua experiência?\n` +
                        `Digite seu comentário ou "pular" se não quiser comentar:`;

        await this.sendMessage(sock, from, message2);
        this.userStates.set(userPhone, userState);

        return true;
    }

    async handleComment(sock, from, message, userPhone) {
        const userState = this.userStates.get(userPhone);
        const comment = message.trim().toLowerCase() === 'pular' ? '' : message.trim();

        // Salvar feedback no backend
        const feedbackData = {
            orderId: userState.orderId,
            rating: userState.rating,
            comment: comment,
            source: 'whatsapp',
            userPhone: userPhone
        };

        const saved = await this.saveFeedback(feedbackData);

        if (saved) {
            const thankMessage = `🙏 Muito obrigado pelo seu feedback!\n\n` +
                               `Sua avaliação nos ajuda a melhorar nosso atendimento.\n` +
                               `Esperamos vê-lo novamente em breve! 😊`;
            
            await this.sendMessage(sock, from, thankMessage);
        } else {
            await this.sendMessage(sock, from, 'Erro ao salvar sua avaliação. Tente novamente mais tarde.');
        }

        this.userStates.delete(userPhone);
        return true;
    }

    async saveFeedback(feedbackData) {
        try {
            const response = await axios.post(`${this.API_BASE}/satisfaction/feedback`, feedbackData);
            console.log('Feedback salvo:', response.data);
            return true;
        } catch (error) {
            console.error('Erro ao salvar feedback:', error);
            return false;
        }
    }

    getRatingText(rating) {
        const ratings = {
            1: 'Péssimo',
            2: 'Ruim', 
            3: 'Regular',
            4: 'Bom',
            5: 'Excelente'
        };
        return ratings[rating] || 'Indefinido';
    }

    async sendMessage(sock, to, message) {
        try {
            await sock.sendMessage(to, { text: message });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    isUserInSatisfactionFlow(userPhone) {
        return this.userStates.has(userPhone);
    }

    clearUserState(userPhone) {
        this.userStates.delete(userPhone);
    }
}

module.exports = SatisfactionFlow;
