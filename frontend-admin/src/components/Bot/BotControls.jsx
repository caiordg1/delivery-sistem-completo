// /frontend-admin/src/components/Bot/BotControls.jsx
/**
 * Componente de controles do Bot WhatsApp
 * Botões para Start, Stop, Restart e ações de gerenciamento
 */

import React, { useState } from 'react';

const BotControls = ({ 
  botStatus, 
  isLoading, 
  onStart, 
  onStop, 
  onRestart,
  onRefresh 
}) => {
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Executar ação com loading
  const executeAction = async (action, actionName) => {
    setActionLoading(actionName);
    try {
      await action();
    } finally {
      setActionLoading(null);
      setShowConfirmStop(false);
      setShowConfirmRestart(false);
    }
  };

  // Verificar se bot está conectado
  const isConnected = botStatus === 'connected';
  const isDisconnected = botStatus === 'disconnected';
  const isConnecting = botStatus === 'connecting' || botStatus === 'waiting_qr';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          🎛️ Controles do Bot
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

      {/* Controles Principais */}
      <div className="space-y-3">
        
        {/* Botão Iniciar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Iniciar Bot</h4>
            <p className="text-sm text-gray-500">
              Conectar o bot ao WhatsApp e iniciar atendimento
            </p>
          </div>
          <button
            onClick={() => executeAction(onStart, 'start')}
            disabled={isLoading || isConnected || isConnecting || actionLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDisconnected && !actionLoading
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {actionLoading === 'start' ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Iniciando...</span>
              </div>
            ) : (
              <>
                <span className="mr-2">▶️</span>
                Iniciar
              </>
            )}
          </button>
        </div>

        {/* Botão Parar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Parar Bot</h4>
            <p className="text-sm text-gray-500">
              Desconectar o bot do WhatsApp e parar atendimento
            </p>
          </div>
          {showConfirmStop ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowConfirmStop(false)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeAction(onStop, 'stop')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                {actionLoading === 'stop' ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Parando...</span>
                  </div>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmStop(true)}
              disabled={isLoading || isDisconnected || actionLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                (isConnected || isConnecting) && !actionLoading
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="mr-2">⏹️</span>
              Parar
            </button>
          )}
        </div>

        {/* Botão Reiniciar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Reiniciar Bot</h4>
            <p className="text-sm text-gray-500">
              Desconectar e conectar novamente (limpa sessão)
            </p>
          </div>
          {showConfirmRestart ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowConfirmRestart(false)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeAction(onRestart, 'restart')}
                disabled={actionLoading}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                {actionLoading === 'restart' ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Reiniciando...</span>
                  </div>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmRestart(true)}
              disabled={isLoading || actionLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !actionLoading
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="mr-2">🔄</span>
              Reiniciar
            </button>
          )}
        </div>
      </div>

      {/* Status Atual */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Status Atual:</span>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <>
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Verificando...</span>
              </>
            ) : (
              <>
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' :
                  isConnecting ? 'bg-orange-500' :
                  botStatus === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}></div>
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-700' :
                  isConnecting ? 'text-orange-700' :
                  botStatus === 'error' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {isConnected ? 'Conectado e funcionando' :
                   isConnecting ? 'Tentando conectar...' :
                   botStatus === 'error' ? 'Erro na conexão' :
                   'Desconectado'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alertas e Avisos */}
      {botStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-red-600 mt-0.5">⚠️</span>
            <div className="text-sm text-red-700">
              <strong>Atenção:</strong> Bot com problemas de conexão. 
              Tente reiniciar ou verifique os logs para mais detalhes.
            </div>
          </div>
        </div>
      )}

      {botStatus === 'waiting_qr' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 mt-0.5">📱</span>
            <div className="text-sm text-orange-700">
              <strong>Ação necessária:</strong> QR Code gerado. 
              Escaneie com WhatsApp para completar a conexão.
            </div>
          </div>
        </div>
      )}

      {/* Dica de Uso */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 mt-0.5">💡</span>
          <div className="text-sm text-blue-700">
            <strong>Dica:</strong> Use "Reiniciar" se o bot não estiver respondendo corretamente. 
            Isso limpa a sessão e força uma nova conexão.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotControls;
