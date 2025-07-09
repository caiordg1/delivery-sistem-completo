// src/services/stateManager.js
// Sistema de Gerenciamento de Estados para Fluxo Avançado

class StateManager {
    constructor() {
        this.userSessions = new Map();
        this.sessionTimeout = 10 * 60 * 1000; // 10 minutos
        this.setupCleanupInterval();
        
        console.log('[StateManager] Iniciado com sucesso');
    }

    // Estados do fluxo do pedido
    static STATES = {
        IDLE: 'idle',
        CONFIRMING_CUSTOMER_DATA: 'confirming_customer_data',
        CONFIRMING_ORDER: 'confirming_order',
        COLLECTING_NAME: 'collecting_name',
        COLLECTING_STREET: 'collecting_street',
        COLLECTING_NUMBER: 'collecting_number',
        COLLECTING_OBSERVATIONS: 'collecting_observations',
        SELECTING_PAYMENT: 'selecting_payment',
        WAITING_PAYMENT: 'waiting_payment',
        ORDER_COMPLETED: 'order_completed'
    };

    // Inicializa sessão do usuário
    initializeSession(phoneNumber) {
        if (!this.userSessions.has(phoneNumber)) {
            this.userSessions.set(phoneNumber, {
                state: StateManager.STATES.IDLE,
                data: {},
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
        }
        
        this.updateActivity(phoneNumber);
        return this.userSessions.get(phoneNumber);
    }

    // Atualiza estado do usuário
    setState(phoneNumber, newState, data = {}) {
        const session = this.initializeSession(phoneNumber);
        session.state = newState;
        session.data = { ...session.data, ...data };
        session.lastActivity = Date.now();
        
        console.log(`[StateManager] ${phoneNumber} → ${newState}`);
        return session;
    }

    // Obtém estado atual
    getState(phoneNumber) {
        const session = this.userSessions.get(phoneNumber);
        return session ? session.state : StateManager.STATES.IDLE;
    }

    // Obtém dados do usuário
    getUserData(phoneNumber) {
        const session = this.userSessions.get(phoneNumber);
        return session ? session.data : {};
    }

    // Atualiza dados sem mudar estado
    updateData(phoneNumber, newData) {
        const session = this.initializeSession(phoneNumber);
        session.data = { ...session.data, ...newData };
        session.lastActivity = Date.now();
        return session.data;
    }

    // Reset completo da sessão
    resetSession(phoneNumber) {
        this.userSessions.delete(phoneNumber);
        console.log(`[StateManager] Sessão resetada: ${phoneNumber}`);
    }

    // Verifica se usuário está em fluxo ativo
    isInActiveFlow(phoneNumber) {
        const state = this.getState(phoneNumber);
        return state !== StateManager.STATES.IDLE;
    }

    // Atualiza última atividade
    updateActivity(phoneNumber) {
        const session = this.userSessions.get(phoneNumber);
        if (session) {
            session.lastActivity = Date.now();
        }
    }

    // Limpa sessões expiradas
    setupCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            for (const [phoneNumber, session] of this.userSessions) {
                if (now - session.lastActivity > this.sessionTimeout) {
                    this.resetSession(phoneNumber);
                }
            }
        }, 10 * 60 * 1000); // Verifica a cada 10 minutos
    }

    // Obtém todas as sessões ativas (para debug)
    getActiveSessions() {
        return Array.from(this.userSessions.keys());
    }

    // Exporta dados da sessão (para debug)
    exportSession(phoneNumber) {
        const session = this.userSessions.get(phoneNumber);
        if (!session) return null;

        return {
            phoneNumber,
            state: session.state,
            data: session.data,
            createdAt: new Date(session.createdAt).toISOString(),
            lastActivity: new Date(session.lastActivity).toISOString()
        };
    }
}

module.exports = StateManager;
