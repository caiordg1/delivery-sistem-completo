const orderTicketTemplate = require('../templates/orderTicketTemplate');

class ThermalPrinterService {
  constructor() {
    this.printers = new Map();
    this.defaultConfig = {
      type: 'EPSON',
      width: 48,
      characterSet: 'BRAZIL'
    };
    // Inicializar após o serviço estar pronto
    setTimeout(() => this.initializeDefaultPrinters(), 1000);
  }

  // Inicializar impressoras padrão
  async initializeDefaultPrinters() {
    try {
      if (process.env.THERMAL_PRINTING_ENABLED === 'true') {
        console.log('🖨️  Inicializando impressoras térmicas...');
        // Por enquanto, vamos apenas simular
        console.log('⚠️  Modo simulação - impressoras não conectadas');
      } else {
        console.log('⚠️  Sistema de impressão térmica desabilitado');
      }
    } catch (error) {
      console.error('Erro ao inicializar impressoras:', error);
    }
  }

  // Inicializar impressora
  async initPrinter(name, config) {
    try {
      console.log(`✅ Impressora ${name} seria inicializada (modo simulação)`);
      this.printers.set(name, {
        printer: null,
        config: config,
        status: 'simulated'
      });
      return true;
    } catch (error) {
      console.error(`❌ Erro ao inicializar impressora ${name}:`, error.message);
      return false;
    }
  }

  // Imprimir pedido
  async printOrder(order, printerName = 'main') {
    try {
      console.log('⚠️  Impressão térmica em modo simulação');
      console.log(`📄 Pedido #${order._id} seria impresso em ${printerName}`);
      
      // Gerar template apenas para log
      const ticketContent = orderTicketTemplate(order);
      console.log('Conteúdo da comanda:', ticketContent.substring(0, 200) + '...');
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao simular impressão:`, error.message);
      return false;
    }
  }

  // Teste de impressão
  async printTest(printerName = 'main') {
    try {
      console.log('⚠️  Teste de impressão em modo simulação');
      console.log(`Impressora ${printerName} - teste OK`);
      return true;
    } catch (error) {
      console.error('❌ Erro no teste de impressão:', error.message);
      throw error;
    }
  }

  // Verificar status
  getPrinterStatus(printerName) {
    return 'simulated';
  }

  // Listar impressoras
  listPrinters() {
    return [
      {
        name: 'main',
        status: 'simulated',
        interface: 'USB (simulado)',
        error: null
      },
      {
        name: 'kitchen',
        status: 'simulated',
        interface: 'Ethernet (simulado)',
        error: null
      }
    ];
  }
}

module.exports = new ThermalPrinterService();
