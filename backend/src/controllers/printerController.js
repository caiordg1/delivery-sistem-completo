const thermalPrinterService = require('../services/thermalPrinterService');
const Order = require('../models/Order');

class PrinterController {
  // Listar impressoras
  async listPrinters(req, res) {
    try {
      const printers = thermalPrinterService.listPrinters();
      res.json({ success: true, printers });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Teste de impressão
  async testPrint(req, res) {
    try {
      const { printerName = 'main' } = req.body;
      await thermalPrinterService.printTest(printerName);
      res.json({ success: true, message: 'Teste de impressão enviado' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Reimprimir pedido
  async reprintOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { printerName = 'main' } = req.body;
      
      const order = await Order.findById(orderId)
        .populate('customer')
        .populate('items.product');
      
      if (!order) {
        return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
      }
      
      await thermalPrinterService.printOrder(order, printerName);
      res.json({ success: true, message: 'Pedido reimpresso com sucesso' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Status da impressora
  async getPrinterStatus(req, res) {
    try {
      const { printerName } = req.params;
      const status = thermalPrinterService.getPrinterStatus(printerName);
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PrinterController();
