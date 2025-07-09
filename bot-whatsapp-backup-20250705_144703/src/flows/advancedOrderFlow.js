// /bot-whatsapp/src/flows/advancedOrderFlow.js
// Fluxo Avançado de Pedidos - Pós Cardápio Digital

const StateManager = require('../services/stateManager');
const apiService = require('../services/apiService');
const validationService = require('../services/validationService');
const paymentService = require('../services/paymentService');

class AdvancedOrderFlow {
    constructor(stateManager, whatsappService) {
        this.stateManager = stateManager;
        this.whatsapp = whatsappService;
        this.maxRetries = 3;
    }

    /**
     * Processa mensagem baseada no estado atual do usuário
     */
    async processMessage(phoneNumber, message, messageType = 'text') {
        try {
            const currentState = this.stateManager.getUserState(phoneNumber);
            const context = this.stateManager.getUserContext(phoneNumber);

            // Log da interação
            console.log(`[BOT] ${phoneNumber} - Estado: ${currentState} - Mensagem: ${message}`);

            // Comandos globais que funcionam em qualquer estado
            if (await this.handleGlobalCommands(phoneNumber, message)) {
                return;
            }

            // Roteamento baseado no estado
            switch (currentState) {
                case StateManager.STATES.IDLE:
                    await this.handleIdleState(phoneNumber, message);
                    break;

                case StateManager.STATES.CONFIRMING_ORDER:
                    await this.handleOrderConfirmation(phoneNumber, message);
                    break;

                case StateManager.STATES.PROVIDING_DETAILS:
                    await this.handlePersonalDetails(phoneNumber, message);
                    break;

                case StateManager.STATES.CONFIRMING_ADDRESS:
                    await this.handleAddressConfirmation(phoneNumber, message);
                    break;

                case StateManager.STATES.SELECTING_PAYMENT:
                    await this.handlePaymentSelection(phoneNumber, message);
                    break;

                case StateManager.STATES.WAITING_PAYMENT:
                    await this.handlePaymentStatus(phoneNumber, message);
                    break;

                case StateManager.STATES.TRACKING_ORDER:
                    await this.handleOrderTracking(phoneNumber, message);
                    break;

                case StateManager.STATES.CUSTOMER_SUPPORT:
                    await this.handleCustomerSupport(phoneNumber, message);
                    break;

                case StateManager.STATES.EDITING_ORDER:
                    await this.handleOrderEditing(phoneNumber, message);
                    break;

                default:
                    await this.handleUnknownState(phoneNumber, message);
            }

        } catch (error) {
            console.error('[BOT ERROR]', error);
            await this.sendErrorMessage(phoneNumber, error);
        }
    }

    /**
     * Manipula comandos globais (funcionam em qualquer estado)
     */
    async handleGlobalCommands(phoneNumber, message) {
        const lowerMessage = message.toLowerCase().trim();

        // Comandos de cancelamento
        if (['cancelar', 'cancel', 'sair', 'parar', 'pare'].includes(lowerMessage)) {
            await this.cancelCurrentFlow(phoneNumber);
            return true;
        }

        // Comandos de ajuda
        if (['ajuda', 'help', 'menu', 'opções', 'opcoes'].includes(lowerMessage)) {
            await this.showHelpMenu(phoneNumber);
            return true;
        }

        // Comando de status do pedido
        if (['status', 'pedido', 'meu pedido'].includes(lowerMessage)) {
            await this.showOrderStatus(phoneNumber);
            return true;
        }

        // Comando para falar com atendente
        if (['atendente', 'humano', 'suporte', 'reclamação', 'problema'].includes(lowerMessage)) {
            await this.transferToSupport(phoneNumber);
            return true;
        }

        return false;
    }

    /**
     * Estado IDLE - Aguardando interação
     */
    async handleIdleState(phoneNumber, message) {
        // Verifica se a mensagem é um resumo de pedido do cardápio
        if (await this.isOrderSummaryFromMenu(message)) {
            await this.processOrderFromMenu(phoneNumber, message);
        } else {
            await this.showMainMenu(phoneNumber);
        }
    }

    /**
     * Processa pedido vindo do cardápio digital
     */
    async processOrderFromMenu(phoneNumber, orderSummary) {
        try {
            // Extrai dados do pedido do resumo
            const orderData = await this.parseOrderSummary(orderSummary);
            
            if (!orderData) {
                await this.sendMessage(phoneNumber, 
                    "❌ Não consegui processar seu pedido. Por favor, tente novamente pelo cardápio digital.");
                return;
            }

            // Salva dados do pedido no contexto
            this.stateManager.updateState(phoneNumber, StateManager.STATES.CONFIRMING_ORDER, {
                [StateManager.CONTEXT_TYPES.ORDER_DATA]: orderData
            });

            // Exibe resumo formatado e pede confirmação
            await this.showOrderConfirmation(phoneNumber, orderData);

        } catch (error) {
            console.error('[ORDER FROM MENU ERROR]', error);
            await this.sendMessage(phoneNumber, 
                "❌ Ocorreu um erro ao processar seu pedido. Tente novamente em alguns instantes.");
        }
    }

    /**
     * Exibe confirmação do pedido
     */
    async showOrderConfirmation(phoneNumber, orderData) {
        let message = "🛒 *CONFIRMAÇÃO DO SEU PEDIDO*\n\n";
        
        // Lista os itens
        message += "📋 *Itens do pedido:*\n";
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Qtd: ${item.quantity} | R$ ${item.price.toFixed(2)}\n`;
            if (item.observations) {
                message += `   📝 ${item.observations}\n`;
            }
            message += "\n";
        });

        // Totais
        message += `💰 *Subtotal:* R$ ${orderData.subtotal.toFixed(2)}\n`;
        if (orderData.deliveryFee) {
            message += `🚚 *Taxa de entrega:* R$ ${orderData.deliveryFee.toFixed(2)}\n`;
        }
        message += `💵 *TOTAL:* R$ ${orderData.total.toFixed(2)}\n\n`;

        message += "✅ Confirma este pedido?\n\n";
        message += "Digite:\n";
        message += "• *1* - Confirmar pedido\n";
        message += "• *2* - Editar pedido\n";
        message += "• *3* - Cancelar pedido";

        await this.sendMessage(phoneNumber, message);
    }

    /**
     * Manipula confirmação do pedido
     */
    async handleOrderConfirmation(phoneNumber, message) {
        const option = message.trim();

        switch (option) {
            case '1':
                await this.proceedToPersonalDetails(phoneNumber);
                break;
            case '2':
                await this.enterEditMode(phoneNumber);
                break;
            case '3':
                await this.cancelOrder(phoneNumber);
                break;
            default:
                await this.handleInvalidOption(phoneNumber, 'confirmation');
        }
    }

    /**
     * Coleta dados pessoais do cliente
     */
    async proceedToPersonalDetails(phoneNumber) {
        // Verifica se já tem dados pessoais salvos
        const context = this.stateManager.getUserContext(phoneNumber);
        const personalInfo = context[StateManager.CONTEXT_TYPES.PERSONAL_INFO];

        if (personalInfo && personalInfo.name && personalInfo.email) {
            // Já tem dados, pula para endereço
            await this.proceedToAddressConfirmation(phoneNumber);
        } else {
            // Precisa coletar dados
            this.stateManager.updateState(phoneNumber, StateManager.STATES.PROVIDING_DETAILS);
            
            await this.sendMessage(phoneNumber, 
                "👤 *DADOS PESSOAIS*\n\n" +
                "Para finalizar seu pedido, preciso de algumas informações:\n\n" +
                "Por favor, me informe seu *nome completo*:"
            );
        }
    }

    /**
     * Manipula coleta de dados pessoais
     */
    async handlePersonalDetails(phoneNumber, message) {
        const context = this.stateManager.getUserContext(phoneNumber);
        const personalInfo = context[StateManager.CONTEXT_TYPES.PERSONAL_INFO] || {};

        if (!personalInfo.name) {
            // Coletando nome
            if (validationService.isValidName(message)) {
                personalInfo.name = message.trim();
                this.stateManager.updateContext(phoneNumber, {
                    [StateManager.CONTEXT_TYPES.PERSONAL_INFO]: personalInfo
                });

                await this.sendMessage(phoneNumber, 
                    `Obrigado, *${personalInfo.name}*! 😊\n\n` +
                    "Agora preciso do seu *e-mail* para enviar a confirmação do pedido:"
                );
            } else {
                await this.sendMessage(phoneNumber, 
                    "❌ Por favor, digite um nome válido (mínimo 2 caracteres):");
            }
        } else if (!personalInfo.email) {
            // Coletando e-mail
            if (validationService.isValidEmail(message)) {
                personalInfo.email = message.trim().toLowerCase();
                this.stateManager.updateContext(phoneNumber, {
                    [StateManager.CONTEXT_TYPES.PERSONAL_INFO]: personalInfo
                });

                await this.sendMessage(phoneNumber, 
                    "✅ E-mail registrado com sucesso!\n\n" +
                    "Agora vamos confirmar o endereço de entrega..."
                );

                // Avança para endereço
                await this.proceedToAddressConfirmation(phoneNumber);
            } else {
                await this.sendMessage(phoneNumber, 
                    "❌ E-mail inválido. Por favor, digite um e-mail válido:");
            }
        }
    }

    /**
     * Confirma endereço de entrega
     */
    async proceedToAddressConfirmation(phoneNumber) {
        this.stateManager.updateState(phoneNumber, StateManager.STATES.CONFIRMING_ADDRESS);

        await this.sendMessage(phoneNumber, 
            "📍 *ENDEREÇO DE ENTREGA*\n\n" +
            "Por favor, me informe seu endereço completo:\n\n" +
            "📝 *Formato:*\n" +
            "Rua/Avenida, Número\n" +
            "Bairro, Cidade\n" +
            "CEP: 00000-000\n" +
            "Complemento (se houver)\n\n" +
            "*Exemplo:*\n" +
            "Rua das Flores, 123\n" +
            "Centro, São Paulo\n" +
            "CEP: 01234-567\n" +
            "Apto 45"
        );
    }

    /**
     * Manipula confirmação de endereço
     */
    async handleAddressConfirmation(phoneNumber, message) {
        const addressData = validationService.parseAddress(message);

        if (addressData.isValid) {
            // Calcula taxa de entrega
            const deliveryFee = await this.calculateDeliveryFee(addressData);
            
            // Salva endereço e taxa
            this.stateManager.updateContext(phoneNumber, {
                [StateManager.CONTEXT_TYPES.ADDRESS_INFO]: {
                    ...addressData,
                    deliveryFee
                }
            });

            // Atualiza total do pedido
            await this.updateOrderTotal(phoneNumber, deliveryFee);

            // Mostra resumo e pede confirmação
            await this.showAddressConfirmation(phoneNumber, addressData, deliveryFee);
        } else {
            const retryCount = this.stateManager.incrementRetry(phoneNumber);
            
            if (retryCount <= this.maxRetries) {
                await this.sendMessage(phoneNumber, 
                    "❌ Endereço incompleto ou inválido.\n\n" +
                    "Por favor, informe o endereço completo com:\n" +
                    "• Rua e número\n" +
                    "• Bairro e cidade\n" +
                    "• CEP\n\n" +
                    `Tentativa ${retryCount}/${this.maxRetries}`
                );
            } else {
                await this.transferToSupport(phoneNumber, 
                    "Muitas tentativas de endereço inválido. Transferindo para atendente...");
            }
        }
    }

    /**
     * Exibe confirmação de endereço
     */
    async showAddressConfirmation(phoneNumber, addressData, deliveryFee) {
        let message = "📍 *CONFIRMAÇÃO DE ENDEREÇO*\n\n";
        message += `📧 *Endereço:*\n${addressData.fullAddress}\n\n`;
        message += `🚚 *Taxa de entrega:* R$ ${deliveryFee.toFixed(2)}\n\n`;
        
        // Mostra novo total
        const context = this.stateManager.getUserContext(phoneNumber);
        const orderData = context[StateManager.CONTEXT_TYPES.ORDER_DATA];
        message += `💵 *NOVO TOTAL:* R$ ${orderData.total.toFixed(2)}\n\n`;
        
        message += "✅ Endereço correto?\n\n";
        message += "Digite:\n";
        message += "• *1* - Confirmar endereço\n";
        message += "• *2* - Corrigir endereço";

        await this.sendMessage(phoneNumber, message);
    }

    /**
     * Processa seleção de pagamento
     */
    async proceedToPaymentSelection(phoneNumber) {
        this.stateManager.updateState(phoneNumber, StateManager.STATES.SELECTING_PAYMENT);

        await this.sendMessage(phoneNumber, 
            "💳 *FORMA DE PAGAMENTO*\n\n" +
            "Escolha como deseja pagar:\n\n" +
            "🏦 *PIX (Aprovação instantânea)*\n" +
            "• *1* - PIX via MercadoPago\n" +
            "• *2* - PIX via PagSeguro\n" +
            "• *3* - PIX via PicPay\n\n" +
            "💳 *Cartão de Crédito/Débito*\n" +
            "• *4* - Cartão via MercadoPago\n" +
            "• *5* - Cartão via PagSeguro\n" +
            "• *6* - Cartão via PicPay\n\n" +
            "💰 *Outras opções*\n" +
            "• *7* - Dinheiro na entrega\n\n" +
            "Digite o *número* da opção desejada:"
        );
    }

    /**
     * Manipula seleção de pagamento
     */
    async handlePaymentSelection(phoneNumber, message) {
        const option = message.trim();
        const paymentMethods = {
            '1': { type: 'pix', gateway: 'mercadopago', name: 'PIX via MercadoPago' },
            '2': { type: 'pix', gateway: 'pagseguro', name: 'PIX via PagSeguro' },
            '3': { type: 'pix', gateway: 'picpay', name: 'PIX via PicPay' },
            '4': { type: 'card', gateway: 'mercadopago', name: 'Cartão via MercadoPago' },
            '5': { type: 'card', gateway: 'pagseguro', name: 'Cartão via PagSeguro' },
            '6': { type: 'card', gateway: 'picpay', name: 'Cartão via PicPay' },
            '7': { type: 'cash', gateway: 'cash', name: 'Dinheiro na entrega' }
        };

        if (paymentMethods[option]) {
            const selectedMethod = paymentMethods[option];
            
            // Salva método escolhido
            this.stateManager.updateContext(phoneNumber, {
                [StateManager.CONTEXT_TYPES.PAYMENT_INFO]: selectedMethod
            });

            if (selectedMethod.type === 'cash') {
                await this.processCashPayment(phoneNumber);
            } else {
                await this.processDigitalPayment(phoneNumber, selectedMethod);
            }
        } else {
            await this.handleInvalidOption(phoneNumber, 'payment');
        }
    }

    /**
     * Processa pagamento em dinheiro
     */
    async processCashPayment(phoneNumber) {
        await this.sendMessage(phoneNumber, 
            "💰 *PAGAMENTO EM DINHEIRO*\n\n" +
            "Você escolheu pagar na entrega.\n\n" +
            "💡 *Precisa de troco?*\n\n" +
            "Digite:\n" +
            "• *1* - Não preciso de troco\n" +
            "• *2* - Preciso de troco para R$ ___\n" +
            "• Digite o valor para o qual precisa de troco"
        );
    }

    /**
     * Processa pagamento digital
     */
    async processDigitalPayment(phoneNumber, paymentMethod) {
        try {
            this.stateManager.updateState(phoneNumber, StateManager.STATES.WAITING_PAYMENT);

            await this.sendMessage(phoneNumber, 
                `💳 *${paymentMethod.name}*\n\n` +
                "⏳ Gerando link de pagamento...\n\n" +
                "Aguarde um momento..."
            );

            // Cria pedido no backend
            const order = await this.createOrder(phoneNumber);
            
            if (order && order.id) {
                // Gera link de pagamento
                const paymentLink = await paymentService.generatePaymentLink(
                    order.id, 
                    paymentMethod.gateway, 
                    paymentMethod.type
                );

                if (paymentLink) {
                    await this.sendPaymentLink(phoneNumber, paymentLink, paymentMethod);
                } else {
                    throw new Error('Falha ao gerar link de pagamento');
                }
            } else {
                throw new Error('Falha ao criar pedido');
            }

        } catch (error) {
            console.error('[PAYMENT ERROR]', error);
            await this.sendMessage(phoneNumber, 
                "❌ Erro ao processar pagamento.\n\n" +
                "Por favor, tente novamente ou escolha outra forma de pagamento."
            );
            
            // Volta para seleção de pagamento
            await this.proceedToPaymentSelection(phoneNumber);
        }
    }

    /**
     * Envia link de pagamento
     */
    async sendPaymentLink(phoneNumber, paymentLink, paymentMethod) {
        let message = `💳 *${paymentMethod.name}*\n\n`;
        
        if (paymentMethod.type === 'pix') {
            message += "📱 *Pagamento PIX*\n\n";
            message += "Clique no link abaixo para pagar:\n";
            message += `${paymentLink}\n\n`;
            message += "✅ Após o pagamento, seu pedido será confirmado automaticamente!\n\n";
            message += "⏰ Link válido por 30 minutos";
        } else {
            message += "💳 *Pagamento com Cartão*\n\n";
            message += "Clique no link abaixo para inserir os dados do cartão:\n";
            message += `${paymentLink}\n\n`;
            message += "🔒 Ambiente 100% seguro\n";
            message += "✅ Confirmação instantânea";
        }

        await this.sendMessage(phoneNumber, message);

        // Agenda verificação de pagamento
        this.schedulePaymentCheck(phoneNumber);
    }

    /**
     * Agenda verificação periódica do pagamento
     */
    schedulePaymentCheck(phoneNumber) {
        const checkInterval = setInterval(async () => {
            const currentState = this.stateManager.getUserState(phoneNumber);
            
            if (currentState !== StateManager.STATES.WAITING_PAYMENT) {
                clearInterval(checkInterval);
                return;
            }

            // Verifica status do pagamento
            const context = this.stateManager.getUserContext(phoneNumber);
            const orderData = context[StateManager.CONTEXT_TYPES.ORDER_DATA];
            
            if (orderData && orderData.orderId) {
                const paymentStatus = await this.checkPaymentStatus(orderData.orderId);
                
                if (paymentStatus === 'paid') {
                    clearInterval(checkInterval);
                    await this.confirmOrderPayment(phoneNumber);
                } else if (paymentStatus === 'failed') {
                    clearInterval(checkInterval);
                    await this.handlePaymentFailure(phoneNumber);
                }
            }
        }, 30000); // Verifica a cada 30 segundos

        // Para a verificação após 30 minutos
        setTimeout(() => {
            clearInterval(checkInterval);
            
            const currentState = this.stateManager.getUserState(phoneNumber);
            if (currentState === StateManager.STATES.WAITING_PAYMENT) {
                this.handlePaymentTimeout(phoneNumber);
            }
        }, 30 * 60 * 1000);
    }

    /**
     * Confirma pagamento e finaliza pedido
     */
    async confirmOrderPayment(phoneNumber) {
        this.stateManager.updateState(phoneNumber, StateManager.STATES.ORDER_CONFIRMED);

        const context = this.stateManager.getUserContext(phoneNumber);
        const orderData = context[StateManager.CONTEXT_TYPES.ORDER_DATA];
        const personalInfo = context[StateManager.CONTEXT_TYPES.PERSONAL_INFO];

        let message = "🎉 *PEDIDO CONFIRMADO!*\n\n";
        message += `✅ Pagamento aprovado com sucesso!\n`;
        message += `📋 *Número do pedido:* #${orderData.orderNumber}\n\n`;
        message += `👤 *Cliente:* ${personalInfo.name}\n`;
        message += `⏰ *Tempo estimado:* ${orderData.estimatedTime || '45-60 minutos'}\n\n`;
        message += "🍽️ Seu pedido já foi enviado para nossa cozinha!\n\n";
        message += "📱 Você receberá atualizações do status aqui no WhatsApp.\n\n";
        message += "💌 Enviamos a confirmação por e-mail também!";

        await this.sendMessage(phoneNumber, message);

        // Agenda próximas comunicações
        this.scheduleOrderUpdates(phoneNumber, orderData.orderId);
    }

    /**
     * Agenda atualizações do pedido
     */
    scheduleOrderUpdates(phoneNumber, orderId) {
        // Atualização em 15 minutos
        setTimeout(async () => {
            await this.sendMessage(phoneNumber, 
                "👨‍🍳 *Atualização do pedido*\n\n" +
                "Seu pedido está sendo preparado com carinho!\n" +
                "🔥 Nossa equipe já começou a cozinhar.\n\n" +
                "📱 Digite *status* a qualquer momento para acompanhar."
            );
        }, 15 * 60 * 1000);

        // Atualização em 30 minutos
        setTimeout(async () => {
            await this.sendMessage(phoneNumber, 
                "🚚 *Seu pedido está quase pronto!*\n\n" +
                "⏰ Estimativa: mais 15-20 minutos\n" +
                "🛵 Nosso entregador já está se preparando!"
            );
        }, 30 * 60 * 1000);
    }

    // Métodos auxiliares e de utilidade...

    /**
     * Identifica se a mensagem é um resumo de pedido do cardápio
     */
    async isOrderSummaryFromMenu(message) {
        // Verifica padrões típicos de resumo de pedido
        const patterns = [
            /resumo.*pedido/i,
            /🛒.*total/i,
            /itens.*selecionados/i,
            /quantidade.*\d+/i,
            /subtotal.*r\$/i
        ];

        return patterns.some(pattern => pattern.test(message));
    }

    /**
     * Extrai dados do pedido do resumo enviado
     */
    async parseOrderSummary(orderSummary) {
        try {
            // Implementa parsing inteligente do resumo
            // Este método deve ser adaptado conforme o formato específico
            // que o cardápio digital envia
            
            const data = {
                items: [],
                subtotal: 0,
                deliveryFee: 0,
                total: 0,
                timestamp: new Date()
            };

            // Aqui você implementaria a lógica específica para extrair
            // os dados do formato que seu cardápio digital envia
            
            return data;
        } catch (error) {
            console.error('[PARSE ORDER ERROR]', error);
            return null;
        }
    }

    /**
     * Envia mensagem via WhatsApp
     */
    async sendMessage(phoneNumber, message) {
        try {
            await this.whatsapp.sendMessage(phoneNumber, message);
        } catch (error) {
            console.error('[SEND MESSAGE ERROR]', error);
        }
    }

    /**
     * Mostra menu de ajuda
     */
    async showHelpMenu(phoneNumber) {
        const helpMessage = 
            "🤖 *CENTRAL DE AJUDA*\n\n" +
            "Comandos disponíveis:\n\n" +
            "📋 *menu* - Ver cardápio\n" +
            "📦 *status* - Status do pedido\n" +
            "👨‍💼 *atendente* - Falar com humano\n" +
            "❌ *cancelar* - Cancelar operação\n\n" +
            "💬 Ou digite sua dúvida que eu tento ajudar!";

        await this.sendMessage(phoneNumber, helpMessage);
    }

    /**
     * Transfere para suporte humano
     */
    async transferToSupport(phoneNumber, reason = null) {
        this.stateManager.updateState(phoneNumber, StateManager.STATES.CUSTOMER_SUPPORT);
        
        let message = "👨‍💼 *TRANSFERINDO PARA ATENDENTE*\n\n";
        if (reason) {
            message += `Motivo: ${reason}\n\n`;
        }
        message += "Um de nossos atendentes irá responder em breve.\n\n";
        message += "🕐 Horário de atendimento:\n";
        message += "Segunda a Sexta: 8h às 18h\n";
        message += "Sábados: 8h às 14h";

        await this.sendMessage(phoneNumber, message);
        
        // Notifica equipe de suporte (implementar conforme necessário)
        await this.notifySupport(phoneNumber, reason);
    }
}

module.exports = AdvancedOrderFlow;
