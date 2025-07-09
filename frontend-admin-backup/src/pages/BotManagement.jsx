// /frontend-admin/src/pages/BotManagement.jsx
/**
 * Página principal de gerenciamento do Bot WhatsApp
 * Integra todos os componentes de controle, status, QR e logs
 */

import React, { useState, useEffect, useCallback } from 'react';
import BotStatus from '../components/Bot/BotStatus';
import BotQRCode from '../components/Bot/BotQRCode';
import BotControls from '../components/Bot/BotControls';

const BotManagement = () => {
  // Estados principais
  const [botData, setBotData] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Token de autenticação (deve vir do contexto de auth)
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Headers para requisições
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Função para fazer requisições à API
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/bot${endpoint}`, {
        headers: getHeaders(),
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error(`Erro na API ${endpoint}:`, error);
      throw error;
    }
  };

  // Buscar status do bot
  const fetchBotStatus = useCallback(async () => {
    try {
      const response = await apiRequest('/status');
      setBotData(response.data);
      setError(null);
    } catch (error) {
      setError('Erro ao obter status do bot');
      console.error('Erro status:', error);
    }
  }, []);

  // Buscar QR Code
  const fetchQRCode = useCallback(async () => {
    try {
      const response = await apiRequest('/qr');
      setQrCode(response.data.qrCode);
    } catch (error) {
      console.error('Erro QR:', error);
    }
  }, []);

  // Buscar logs
  const fetchLogs = useCallback(async (limit = 50) => {
    try {
      const response = await apiRequest(`/logs?limit=${limit}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Erro logs:', error);
    }
  }, []);

  // Função para atualizar todos os dados
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchBotStatus(),
        fetchQRCode(),
        fetchLogs()
      ]);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [fetchBotStatus, fetchQRCode, fetchLogs]);

  // Iniciar bot
  const handleStartBot = async () => {
    try {
      setError(null);
      const response = await apiRequest('/start', {
        method: 'POST'
      });
      
      if (response.success) {
        // Aguardar um pouco e atualizar dados
        setTimeout(() => {
          refreshAllData();
        }, 2000);
      }
    } catch (error) {
      setError('Erro ao iniciar bot: ' + error.message);
    }
  };

  // Parar bot
  const handleStopBot = async () => {
    try {
      setError(null);
      const response = await apiRequest('/stop', {
        method: 'POST'
      });
      
      if (response.success) {
        // Atualizar dados imediatamente
        refreshAllData();
      }
    } catch (error) {
      setError('Erro ao parar bot: ' + error.message);
    }
  };

  // Reiniciar bot
  const handleRestartBot = async () => {
    try {
      setError(null);
      const response = await apiRequest('/restart', {
        method: 'POST'
      });
      
      if (response.success) {
        // Aguardar um pouco mais para restart
        setTimeout(() => {
          refreshAllData();
        }, 3000);
      }
    } catch (error) {
      setError('Erro ao reiniciar bot: ' + error.message);
    }
  };

  // Gerar novo QR Code
  const handleRefreshQR = async () => {
    await fetchQRCode();
  };

  // Auto-refresh
  useEffect(() => {
    refreshAllData();

    // Intervalo para atualização automática (a cada 10 segundos)
    const interval = setInterval(() => {
      refreshAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshAllData]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 Gerenciamento do Bot WhatsApp
              </h1>
              <p className="text-gray-600 mt-1">
                Controle e monitore o bot de atendimento automatizado
              </p>
            </div>
            
            {/* Última atualização */}
            <div className="text-right">
              <button
                onClick={refreshAllData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Atualizando...</span>
                  </div>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Atualizar Tudo
                  </>
                )}
              </button>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-1">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Erro Global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Layout Principal */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Coluna Esquerda */}
          <div className="col-span-1 space-y-6">
            
            {/* Status do Bot */}
            <BotStatus
              botData={botData}
              isLoading={isLoading}
              onRefresh={fetchBotStatus}
            />

            {/* Controles */}
            <BotControls
              botStatus={botData?.status}
              isLoading={isLoading}
              onStart={handleStartBot}
              onStop={handleStopBot}
              onRestart={handleRestartBot}
              onRefresh={fetchBotStatus}
            />
          </div>

          {/* Coluna Centro */}
          <div className="col-span-1 space-y-6">
            
            {/* QR Code (só aparece quando necessário) */}
            <BotQRCode
              qrCode={qrCode}
              status={botData?.status}
              onRefreshQR={handleRefreshQR}
              isLoading={isLoading}
            />

            {/* Métricas Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📊 Métricas Rápidas
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {botData?.logsCount || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total de Logs</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {botData?.status === 'connected' ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-green-700">Status</div>
                </div>
              </div>

              {/* Informações do Processo */}
              {botData?.processId && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>PID:</strong> {botData.processId}
                  </div>
                  {botData.startTime && (
                    <div className="text-sm text-gray-600">
                      <strong>Iniciado:</strong> {' '}
                      {botData?.startTime ? new Date(botData.startTime).toLocaleString('pt-BR') : '--'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="col-span-1">
            
          </div>
        </div>

        {/* Footer com Dicas */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dicas de Uso:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Os dados são atualizados automaticamente a cada 10 segundos</li>
            <li>• Use "Reiniciar" se o bot não estiver respondendo corretamente</li>
            <li>• O QR Code expira em 2 minutos - gere um novo se necessário</li>
            <li>• Monitore os logs para identificar problemas de conexão</li>
            <li>• Mantenha apenas um bot ativo por vez para evitar conflitos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BotManagement;
