import api from './api';

// API de Impressoras Térmicas
export const printerApi = {
  // Listar todas as impressoras
  listPrinters: async () => {
    try {
      const response = await api.get('/printer');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar impressoras:', error);
      throw error;
    }
  },

  // Status de uma impressora específica
  getPrinterStatus: async (printerName) => {
    try {
      const response = await api.get(`/printer/status/${printerName}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter status da impressora ${printerName}:`, error);
      throw error;
    }
  },

  // Teste de impressão
  testPrint: async (printerName, message = 'Teste de impressão') => {
    try {
      const response = await api.post('/printer/test', {
        printerName,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      throw error;
    }
  },

  // Reimpressão de pedido
  reprintOrder: async (orderId, printerName = null) => {
    try {
      const response = await api.post(`/printer/reprint/${orderId}`, {
        printerName
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao reimprimir pedido ${orderId}:`, error);
      throw error;
    }
  }
};

export default printerApi;
