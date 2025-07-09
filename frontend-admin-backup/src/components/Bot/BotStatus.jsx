// /frontend-admin/src/components/Bot/BotStatus.jsx
/**
 * Componente para exibir status atual do Bot WhatsApp
 * Mostra conexão, tempo ativo, última atividade
 */

import React, { useState, useEffect } from 'react';

const BotStatus = ({ botData, isLoading, onRefresh }) => {
  const [uptime, setUptime] = useState('');

  // Calcular tempo de atividade
  useEffect(() => {
    if (botData?.startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(botData.startTime);
        const diff = Math.floor((now - start) / 1000);
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        setUptime(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [botData?.startTime]);

  // Definir cor e ícone baseado no status
  const getStatusDisplay = () => {
    if (isLoading) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🔄',
        text: 'Verificando...'
      };
    }

    switch (botData?.status) {
      case 'connected':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '🟢',
          text: 'Online'
        };
      case 'connecting':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: '🔵',
          text: 'Conectando...'
        };
      case 'waiting_qr':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          icon: '📱',
          text: 'Aguardando QR Code'
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '❌',
          text: 'Erro'
        };
      case 'disconnected':
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: '⚪',
          text: 'Desconectado'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header do Card */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          🤖 Bot WhatsApp
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          title="Atualizar status"
        >
          <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Status Principal */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`px-3 py-1 rounded-full ${statusDisplay.bgColor} flex items-center space-x-2`}>
          <span>{statusDisplay.icon}</span>
          <span className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tempo Ativo */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {botData?.status === 'connected' && uptime ? uptime : '--'}
          </div>
          <div className="text-sm text-gray-500">Tempo Ativo</div>
        </div>

        {/* Logs Count */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {botData?.logsCount || 0}
          </div>
          <div className="text-sm text-gray-500">Logs</div>
        </div>
      </div>

      {/* Informações Adicionais */}
      {botData?.status === 'connected' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">PID:</span>
              <span className="ml-2 font-mono">{botData.processId || '--'}</span>
            </div>
            <div>
              <span className="text-gray-500">Iniciado:</span>
              <span className="ml-2">
                {botData.startTime ? 
                  new Date(botData.startTime).toLocaleString('pt-BR') : 
                  '--'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Última Atividade */}
      {botData?.lastActivity && (
        <div className="mt-3 text-sm text-gray-500">
          <span>Última atividade: </span>
          <span className="font-medium">
            {new Date(botData.lastActivity).toLocaleString('pt-BR')}
          </span>
        </div>
      )}

      {/* Mensagem de Erro */}
      {botData?.status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700">
            ⚠️ Bot com problemas. Verifique os logs para mais detalhes.
          </div>
        </div>
      )}

      {/* QR Code Pendente */}
      {botData?.status === 'waiting_qr' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-700">
            📱 QR Code gerado. Escaneie com WhatsApp para conectar.
          </div>
        </div>
      )}
    </div>
  );
};

export default BotStatus;
