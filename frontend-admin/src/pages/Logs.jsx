import React, { useState, useEffect } from 'react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Simulação de logs
  const mockLogs = [
    {
      id: 1,
      timestamp: '2025-06-15 20:45:32',
      level: 'info',
      type: 'http_request',
      message: 'GET /products',
      details: {
        method: 'GET',
        url: '/products',
        statusCode: 200,
        responseTime: '45ms',
        ip: '192.168.1.1'
      }
    },
    {
      id: 2,
      timestamp: '2025-06-15 20:44:15',
      level: 'info',
      type: 'auth_event',
      message: 'Login realizado com sucesso',
      details: {
        action: 'login',
        userId: 'admin@delivery.com',
        ip: '192.168.1.1',
        success: true
      }
    },
    {
      id: 3,
      timestamp: '2025-06-15 20:43:28',
      level: 'info',
      type: 'business_operation',
      message: 'Novo pedido criado',
      details: {
        action: 'order_created',
        orderId: '60f7b1b9e4b0f40015a1b1a1',
        total: 85.50,
        itemsCount: 3
      }
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter || log.type === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Logs</h1>
          <p className="text-gray-600">Monitoramento e auditoria do sistema</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="error">Erros</option>
              <option value="warn">Avisos</option>
              <option value="info">Informações</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Logs Recentes ({filteredLogs.length})
          </h3>
          
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(log.details).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            <span className="font-medium">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum log encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
