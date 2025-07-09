import React, { useState, useEffect } from 'react';
import { printerApi } from '../services/printerApi';
import Loading from '../components/ui/Loading';
import Alert from '../components/ui/Alert';

const Printers = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingPrinter, setTestingPrinter] = useState(null);

  // Buscar impressoras ao carregar
  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      const response = await printerApi.listPrinters();
      setPrinters(response.data || []);
      setError('');
    } catch (err) {
      setError('Erro ao carregar impressoras');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async (printerName) => {
    try {
      setTestingPrinter(printerName);
      setError('');
      
      await printerApi.testPrint(printerName, 'Teste de impressão do painel administrativo');
      setSuccess(`Teste enviado para impressora ${printerName}!`);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Erro no teste da impressora ${printerName}`);
    } finally {
      setTestingPrinter(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      case 'error':
        return '⚠️';
      default:
        return '❓';
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🖨️ Gestão de Impressoras</h1>
          <p className="text-gray-600">Gerencie impressoras térmicas para comandas automáticas</p>
        </div>
        <button
          onClick={loadPrinters}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Alertas */}
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Status Geral */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">📊 Status Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{printers.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {printers.filter(p => p.status === 'online').length}
            </div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {printers.filter(p => p.status === 'offline').length}
            </div>
            <div className="text-sm text-gray-600">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {printers.filter(p => p.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Com Erro</div>
          </div>
        </div>
      </div>

      {/* Lista de Impressoras */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">🖨️ Impressoras Configuradas</h2>
        </div>
        
        {printers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">🖨️</div>
            <h3 className="text-lg font-medium mb-2">Nenhuma impressora configurada</h3>
            <p>Configure suas impressoras térmicas para receber comandas automáticas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {printers.map((printer) => (
              <div key={printer.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🖨️</div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {printer.displayName || printer.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {printer.type === 'usb' ? '🔌 USB' : '🌐 Ethernet'} • 
                          {printer.interface}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(printer.status)}`}>
                      {getStatusIcon(printer.status)} {printer.status}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTestPrint(printer.name)}
                        disabled={testingPrinter === printer.name || printer.status === 'offline'}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {testingPrinter === printer.name ? '⏳' : '📄'} Teste
                      </button>
                      
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Configurar impressora"
                      >
                        ⚙️ Config
                      </button>
                      
                      <button
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Histórico de impressões"
                      >
                        📊 Histórico
                      </button>
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Largura:</span>
                    <span className="ml-2 font-medium">{printer.width}mm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categorias:</span>
                    <span className="ml-2 font-medium">
                      {printer.categories ? printer.categories.join(', ') : 'Todas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Última impressão:</span>
                    <span className="ml-2 font-medium">
                      {printer.lastPrint ? new Date(printer.lastPrint).toLocaleString() : 'Nunca'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fila:</span>
                    <span className="ml-2 font-medium">{printer.queueSize || 0} trabalhos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações do Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Sistema de Impressão Térmica</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• As comandas são impressas automaticamente quando um pedido é criado</p>
              <p>• Configure diferentes impressoras para cozinha, bar e expedição</p>
              <p>• Use o botão "Teste" para verificar se as impressoras estão funcionando</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Printers;
