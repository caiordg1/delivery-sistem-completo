// src/flows/advancedFlow.js
// Fluxo Avançado Completo para Processamento de Pedidos

const StateManager = require('../services/StateManager');
const ValidationService = require('../services/ValidationService');

class AdvancedFlow {
    constructor() {
        this.stateManager = new StateManager();
        
        console.log('[AdvancedFlow] Iniciado com sucesso');
    }

    // Processa mensagem baseada no estado atual do usuário
    async processMessage(sock, chatId, message, userPhone) {
        try {
            const currentState = this.stateManager.getState(userPhone);
            const userData = this.stateManager.getUserData(userPhone);
            
            console.log(`[AdvancedFlow] ${userPhone} | Estado: ${currentState} | Mensagem: ${message.substring(0, 30)}`);

            // Comandos globais (funcionam em qualquer estado)
            if (this.handleGlobalCommands(sock, chatId, message, userPhone)) {
                return true;
            }

            // Processar baseado no estado atual
            switch (currentState) {
                case StateManager.STATES.CONFIRMING_CUSTOMER_DATA:
                    return await this.handleCustomerDataConfirmation(sock, chatId, message, userPhone, userData);
                  
                case StateManager.STATES.CONFIRMING_ORDER:
                    return await this.handleOrderConfirmation(sock, chatId, message, userPhone, userData);
                
                case StateManager.STATES.COLLECTING_NAME:
                    return await this.handleNameCollection(sock, chatId, message, userPhone);
                
                case StateManager.STATES.COLLECTING_STREET:
                    return await this.handleStreetCollection(sock, chatId, message, userPhone);
                
                case StateManager.STATES.COLLECTING_NUMBER:
                    return await this.handleNumberCollection(sock, chatId, message, userPhone);
                
                case StateManager.STATES.COLLECTING_OBSERVATIONS:
                    return await this.handleObservationsCollection(sock, chatId, message, userPhone);
                
                case StateManager.STATES.SELECTING_PAYMENT:
                    return await this.handlePaymentSelection(sock, chatId, message, userPhone, userData);
                
                case StateManager.STATES.WAITING_PAYMENT:
                    return await this.handlePaymentWaiting(sock, chatId, message, userPhone, userData);
                
                default:
                    return false; // Não está em fluxo ativo
            }

        } catch (error) {
            console.error('[AdvancedFlow] Erro:', error);
            await sock.sendMessage(chatId, { 
                text: "❌ Ocorreu um erro. Digite *cancelar* para recomeçar." 
            });
            return true;
        }
    }

    // Comandos globais (cancelar, ajuda, voltar)
    handleGlobalCommands(sock, chatId, message, userPhone) {
        const lowerMessage = message.toLowerCase().trim();
        
        if (['cancelar', 'cancel', 'sair', 'pare', 'parar'].includes(lowerMessage)) {
            this.stateManager.resetSession(userPhone);
            sock.sendMessage(chatId, { 
                text: "❌ *Pedido cancelado!*\n\nDigite *menu* para ver nosso cardápio ou faça um novo pedido em: cardapio.fortalcar.com" 
            });
            return true;
        }
        
        if (['atendente', 'suporte', 'humano'].includes(lowerMessage)) {
            sock.sendMessage(chatId, { 
                text: "🙋‍♂️ *Transferindo para atendimento humano...*\n\nEm breve um de nossos atendentes entrará em contato!" 
            });
            return true;
        }
        
        if (['ajuda', 'help'].includes(lowerMessage)) {
            sock.sendMessage(chatId, { 
                text: "ℹ️ *Comandos disponíveis:*\n\n• *cancelar* - Cancelar pedido\n• *voltar* - Voltar etapa anterior\n• *atendente* - Falar com humano\n• *menu* - Ver cardápio" 
            });
            return true;
        }
        
        if (['voltar', 'volta', 'anterior'].includes(lowerMessage)) {
            return this.handleGoBack(sock, chatId, userPhone);
        }
        
        return false;
    }

    // Função para voltar à etapa anterior
    async handleGoBack(sock, chatId, userPhone) {
        const currentState = this.stateManager.getState(userPhone);
        
        switch (currentState) {
            case StateManager.STATES.COLLECTING_NAME:
                this.stateManager.setState(userPhone, StateManager.STATES.CONFIRMING_ORDER);
                await sock.sendMessage(chatId, { 
                    text: "⬅️ *Voltando...*\n\n✅ Digite *SIM* para confirmar seu pedido\n❌ Digite *NÃO* para cancelar" 
                });
                return true;
                
            case StateManager.STATES.COLLECTING_STREET:
                this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NAME);
                await sock.sendMessage(chatId, { 
                    text: "⬅️ *Voltando...*\n\n👤 Qual seu *nome completo*?" 
                });
                return true;
                
            case StateManager.STATES.COLLECTING_NUMBER:
                this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_STREET);
                await sock.sendMessage(chatId, { 
                    text: "⬅️ *Voltando...*\n\n🏠 Informe o nome da *RUA* para entrega:\n\nExemplo: Rua das Flores" 
                });
                return true;
                
            case StateManager.STATES.COLLECTING_OBSERVATIONS:
                this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NUMBER);
                await sock.sendMessage(chatId, { 
                    text: "⬅️ *Voltando...*\n\n🏠 Agora informe o *NÚMERO* da casa e *COMPLEMENTO* (se houver):\n\nExemplo: 123, Apt 45" 
                });
                return true;
                
            case StateManager.STATES.SELECTING_PAYMENT:
                this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_OBSERVATIONS);
                await sock.sendMessage(chatId, { 
                    text: "⬅️ *Voltando...*\n\n📝 *Alguma observação sobre seu pedido?*\n\nExemplo: Sem cebola, massa fininha\n\nOu digite *pular* se não tiver observações:" 
                });
                return true;
                
            default:
                await sock.sendMessage(chatId, { 
                    text: "❌ Não é possível voltar desta etapa.\n\nDigite *cancelar* para recomeçar." 
                });
                return true;
        }
    }

    // ETAPA 1: Confirmação do pedido (SIM/NÃO)
    async handleOrderConfirmation(sock, chatId, message, userPhone, userData) {
        const lowerMessage = message.toLowerCase().trim();
        
        if (['sim', 's', 'confirmar', 'ok', 'confirmo'].includes(lowerMessage)) {
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NAME);
            
            await sock.sendMessage(chatId, { 
                text: "🎉 *Que alegria! Vamos finalizar seu delicioso pedido!* 😋\n\n👤 Para começar, me conta qual seu *nome completo*?\n\nFico feliz em te atender! 🤗\n\n💡 Digite *voltar* para etapa anterior" 
            });
            return true;
        }
        
        if (['não', 'nao', 'n', 'cancelar'].includes(lowerMessage)) {
            this.stateManager.resetSession(userPhone);
            await sock.sendMessage(chatId, { 
                text: "❌ *Pedido cancelado!*\n\nSem problemas! Acesse nosso cardápio novamente em:\ncardapio.fortalcar.com" 
            });
            return true;
        }
        
        await sock.sendMessage(chatId, { 
            text: "🤔 Não entendi sua resposta.\n\n✅ Digite *SIM* para confirmar o pedido\n❌ Digite *NÃO* para cancelar" 
        });
        return true;
    }

    // ETAPA 2: Coleta do nome
    async handleNameCollection(sock, chatId, message, userPhone) {
        const validation = ValidationService.validateName(message);
        
        if (validation.valid) {
            this.stateManager.updateData(userPhone, { 
                name: validation.value,
                firstName: validation.firstName 
            });
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_STREET);
            
            await sock.sendMessage(chatId, { 
                text: `✅ Prazer em conhecer você, *${validation.firstName}*! 😊\n\n🏠 Agora me conta, qual o nome da *RUA* onde vamos entregar seu pedido?\n\nExemplo: Rua das Flores\n\n💡 Digite *voltar* para etapa anterior` 
            });
            return true;
        }
        
        await sock.sendMessage(chatId, { 
            text: `❌ ${validation.error}\n\nPor favor, informe seu *nome completo* (nome e sobrenome):\n\n💡 Digite *voltar* para voltar` 
        });
        return true;
    }

    // ETAPA 3: Coleta da rua
    async handleStreetCollection(sock, chatId, message, userPhone) {
        const validation = ValidationService.validateStreet(message);
        
        if (validation.valid) {
            this.stateManager.updateData(userPhone, { street: validation.value });
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NUMBER);
            
            await sock.sendMessage(chatId, { 
                text: `✅ Ótimo! Rua anotada: *${validation.value}* 📍\n\n🏠 Agora me fala o *NÚMERO* da sua casa e o *COMPLEMENTO* (se tiver):\n\nExemplo: 123, Apt 45\n\nEstamos quase lá! 😉\n\n💡 Digite *voltar* para etapa anterior` 
            });
            return true;
        }
        
        await sock.sendMessage(chatId, { 
            text: `❌ ${validation.error}\n\nPor favor, informe o nome da rua:\n\n💡 Digite *voltar* para voltar` 
        });
        return true;
    }

    // ETAPA 4: Coleta do número e complemento
    async handleNumberCollection(sock, chatId, message, userPhone) {
        const validation = ValidationService.validateNumber(message);
        
        if (validation.valid) {
            this.stateManager.updateData(userPhone, { 
                number: validation.value,
                fullAddress: `${this.stateManager.getUserData(userPhone).street}, ${validation.value}`
            });
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_OBSERVATIONS);
            
            await sock.sendMessage(chatId, { 
                text: `✅ Perfeito! Endereço anotado: *${this.stateManager.getUserData(userPhone).fullAddress}* 🎯\n\n📝 *Quer fazer alguma observação especial sobre seu pedido?* 🍕\n\nExemplo: Sem cebola, massa fininha, bem assadinha\n\nOu digite *pular* se estiver tudo perfeito do jeito que está! 😋\n\n💡 Digite *voltar* para etapa anterior` 
            });
            return true;
        }
        
        await sock.sendMessage(chatId, { 
            text: `❌ ${validation.error}\n\nPor favor, informe o número da casa e complemento:\n\n💡 Digite *voltar* para voltar` 
        });
        return true;
    }

    // ETAPA 5: Coleta das observações
    async handleObservationsCollection(sock, chatId, message, userPhone) {
        const lowerMessage = message.toLowerCase().trim();
        
        if (['pular', 'nao', 'não', 'sem observação', 'sem observacoes'].includes(lowerMessage)) {
            this.stateManager.updateData(userPhone, { observations: '' });
        } else {
            this.stateManager.updateData(userPhone, { observations: message.trim() });
        }
        
        this.stateManager.setState(userPhone, StateManager.STATES.SELECTING_PAYMENT, { 
            paymentStep: 'timing' 
        });
        
        const obsText = this.stateManager.getUserData(userPhone).observations;
        const confirmObs = obsText ? `✅ *Observações:* ${obsText}` : ' *Sem observações*';
        
        await sock.sendMessage(chatId, { 
            text: `${confirmObs}\n\n💰 *Agora vamos para o pagamento! Como você prefere pagar?* 😊\n\n1️⃣ *Pagar agora* (rápido e prático! 💳)\n2️⃣ *Pagar na entrega* (tranquilidade total! 🚚)\n\nDigite o *número* da sua preferência:\n\n💡 Digite *voltar* para etapa anterior` 
        });
        return true;
    }

    // ETAPA 6: Seleção de pagamento
    async handlePaymentSelection(sock, chatId, message, userPhone, userData) {
        const paymentStep = userData.paymentStep || 'timing';
        
        if (paymentStep === 'timing') {
            const validation = ValidationService.validatePaymentTiming(message);
            
            if (validation.valid) {
                this.stateManager.updateData(userPhone, { 
                    paymentTiming: validation.timing,
                    paymentStep: 'method' 
                });
                
                if (validation.timing === 'now') {
                    await sock.sendMessage(chatId, { 
                        text: `✅ *${validation.label}*\n\n💳 *Escolha a forma:*\n\n1️⃣ *PIX* (aprovação instantânea)\n2️⃣ *Cartão de crédito/débito*\n\nDigite o *número* da opção:\n\n💡 Digite *voltar* para etapa anterior` 
                    });
                } else {
                    await sock.sendMessage(chatId, { 
                        text: `✅ *${validation.label}*\n\n💰 *Escolha a forma:*\n\n1️⃣ *Cartão* (maquininha na entrega)\n2️⃣ *Dinheiro*\n\nDigite o *número* da opção:\n\n💡 Digite *voltar* para etapa anterior` 
                    });
                }
                return true;
            }
            
            await sock.sendMessage(chatId, { 
                text: `❌ ${validation.error}\n\n💡 Digite *voltar* para voltar` 
            });
            return true;
        }
        
        if (paymentStep === 'method') {
            const paymentTiming = userData.paymentTiming;
            let validation;
            
            if (paymentTiming === 'now') {
                validation = ValidationService.validateOnlinePayment(message);
            } else {
                validation = ValidationService.validateDeliveryPayment(message);
            }
            
            if (validation.valid) {
                this.stateManager.updateData(userPhone, { 
                    paymentMethod: validation.method,
                    paymentLabel: validation.label 
                });
                
                if (validation.method === 'cash') {
                    this.stateManager.updateData(userPhone, { paymentStep: 'change' });
                    
                    const orderData = userData.orderData || {};
                    const total = orderData.total || 0;
                    
                    await sock.sendMessage(chatId, { 
                        text: `✅ *${validation.label}*\n\n💵 *Precisa de troco?*\n\nTotal do pedido: *R$ ${total.toFixed(2).replace('.', ',')}*\n\nInforme o valor que vai pagar:\n(Digite apenas o valor, ex: 100 ou R$ 100)\n\n💡 Digite *voltar* para voltar` 
                    });
                    return true;
                } else {
                    return await this.finalizeOrder(sock, chatId, userPhone);
                }
            }
            
            await sock.sendMessage(chatId, { 
                text: `❌ ${validation.error}\n\n💡 Digite *voltar* para voltar` 
            });
            return true;
        }
        
        if (paymentStep === 'change') {
            const orderData = userData.orderData || {};
            const total = orderData.total || 0;
            const validation = ValidationService.validateChange(message, total);
            
            if (validation.valid) {
                this.stateManager.updateData(userPhone, { 
                    paymentValue: validation.paymentValue,
                    changeValue: validation.changeValue 
                });
                
                return await this.finalizeOrder(sock, chatId, userPhone);
            }
            
            await sock.sendMessage(chatId, { 
                text: `❌ ${validation.error}\n\n💡 Digite *voltar* para voltar` 
            });
            return true;
        }
        
        return true;
    }

    // ETAPA 7: Aguardando pagamento
    async handlePaymentWaiting(sock, chatId, message, userPhone, userData) {
        await sock.sendMessage(chatId, { 
            text: "⏳ *Aguardando confirmação do pagamento...*\n\nAssim que o pagamento for confirmado, seu pedido entrará na fila de preparo!\n\nDigite *status* para acompanhar." 
        });
        return true;
    }

    // Finalizar pedido
    async finalizeOrder(sock, chatId, userPhone) {
        const userData = this.stateManager.getUserData(userPhone);
        const orderData = userData.orderData || {};
        
        this.stateManager.setState(userPhone, StateManager.STATES.ORDER_COMPLETED);
        
        // ✅ SALVAR PEDIDO NO BACKEND
        try {
            const api = require('../services/api');
            const pedidoData = {
                customerName: userData.name,
                customerPhone: userPhone,
                customerAddress: userData.fullAddress,
                observations: userData.observations || '',
                items: orderData.items,
                total: orderData.total,
                paymentMethod: userData.paymentLabel || 'whatsapp'
            };
            
            console.log('Salvando pedido no backend:', pedidoData);
            const response = await api.createOrder(pedidoData);
            console.log('Pedido salvo com sucesso:', response.data);
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
        }
        
        let finalMessage = "🎉 *UHUL! SEU PEDIDO FOI CONFIRMADO COM SUCESSO!* 🍕✨\n\nObrigado pela confiança! Estamos preparando tudo com muito carinho para você! 😋❤️\n\n";
        finalMessage += "📋 *Resumo final:*\n";
        
        // Itens do pedido
        if (orderData.items) {
            orderData.items.forEach(item => {
                finalMessage += `• ${item.quantity}x ${item.name} - R$ ${item.total.toFixed(2).replace('.', ',')}\n`;
            });
        }
        
        finalMessage += `\n💰 *Total: R$ ${orderData.total ? orderData.total.toFixed(2).replace('.', ',') : '0,00'}*\n`;
        finalMessage += `👤 *Cliente:* ${userData.name}\n`;
        finalMessage += `📍 *Endereço:* ${userData.fullAddress}\n`;
        
        if (userData.observations) {
            finalMessage += `📝 *Observações:* ${userData.observations}\n`;
        }
        
        finalMessage += `💳 *Pagamento:* ${userData.paymentLabel}`;
        
        // Calcular tempo estimado baseado no dia da semana
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Domingo, 1=Segunda, 2=Terça, etc.

        let estimatedTime;
        if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Segunda a Quinta (1-4)
            estimatedTime = "30-45 minutos";
        } else { // Sexta, Sábado e Domingo (5, 6, 0)
            estimatedTime = "45-60 minutos";
        }

        finalMessage += `\n\n🕐 *Tempo estimado:* ${estimatedTime}`;
        
        if (userData.changeValue && userData.changeValue > 0) {
            finalMessage += `\n💵 *Troco para:* R$ ${userData.paymentValue.toFixed(2).replace('.', ',')}`;
            finalMessage += `\n💰 *Troco:* R$ ${userData.changeValue.toFixed(2).replace('.', ',')}`;
        }
        
        await sock.sendMessage(chatId, { text: finalMessage });
        
        // Limpar sessão após 5 minutos
        setTimeout(() => {
            this.stateManager.resetSession(userPhone);
        }, 5 * 60 * 1000);
        
        return true;
    }

    // Verifica se usuário está em fluxo ativo
    isUserInFlow(userPhone) {
        return this.stateManager.isInActiveFlow(userPhone);
    }

    // Inicia fluxo com dados do pedido do cardápio
    startFlowWithOrder(userPhone, orderData) {
        this.stateManager.setState(userPhone, StateManager.STATES.CONFIRMING_ORDER);
        this.stateManager.updateData(userPhone, { 
            orderData: orderData 
        });
    }

    // Inicia fluxo direto (sem dados de pedido)
    startDirectOrder(userPhone) {
        this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NAME);
        this.stateManager.updateData(userPhone, { 
            orderData: { items: [], total: 0, source: 'direct_whatsapp' }
        });
    }

    // 🆕 NOVA FUNÇÃO: Confirmar dados do cliente existente
    async handleCustomerDataConfirmation(sock, chatId, message, userPhone, userData) {
        const lowerMessage = message.toLowerCase().trim();
        
        if (['sim', 's', 'confirmar', 'ok', 'confirmo'].includes(lowerMessage)) {
            // Cliente confirmou - pular para observações
           const expressData = userData.expressData || {};
           this.stateManager.updateData(userPhone, {
               name: expressData.name,
               fullAddress: expressData.address,
               firstName: expressData.name ? expressData.name.split(' ')[0] : ''
             });
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_OBSERVATIONS);
            
            await sock.sendMessage(chatId, { 
                text: "🎉 *Perfeito! Dados confirmados!* ✅\n\n📝 *Quer fazer alguma observação especial sobre seu pedido?* 🍕\n\nExemplo: Sem cebola, massa fininha, bem assadinha\n\nOu digite *pular* se estiver tudo perfeito do jeito que está! 😋\n\n💡 Digite *voltar* para etapa anterior" 
            });
            return true;
        }
        
        if (['não', 'nao', 'n', 'alterar', 'mudar'].includes(lowerMessage)) {
            // Cliente quer alterar - ir para fluxo normal
            this.stateManager.setState(userPhone, StateManager.STATES.COLLECTING_NAME);
            
            await sock.sendMessage(chatId, { 
                text: "📝 *Sem problemas! Vamos atualizar seus dados.*\n\n👤 Qual seu *nome completo*?\n\n💡 Digite *voltar* para etapa anterior" 
            });
            return true;
        }
        
        await sock.sendMessage(chatId, { 
            text: "🤔 Não entendi sua resposta.\n\n✅ Digite *SIM* para confirmar os dados\n📝 Digite *NÃO* para alterar" 
        });
        return true;
    }

    // 🆕 NOVA FUNÇÃO: Iniciar fluxo expresso
    startExpressFlow(userPhone, customerData) {
        this.stateManager.setState(userPhone, StateManager.STATES.CONFIRMING_CUSTOMER_DATA);
        this.stateManager.updateData(userPhone, { 
            expressData: customerData,
            orderData: { items: [], total: 0, source: 'direct_whatsapp' }
        });
    }

    // 🆕 NOVA FUNÇÃO: Iniciar fluxo expresso COM dados do pedido
    startExpressFlowWithOrder(userPhone, customerData, orderData) {
        this.stateManager.setState(userPhone, StateManager.STATES.CONFIRMING_CUSTOMER_DATA);
        this.stateManager.updateData(userPhone, { 
            expressData: customerData,
            orderData: orderData
        });
    }

}

module.exports = AdvancedFlow;
