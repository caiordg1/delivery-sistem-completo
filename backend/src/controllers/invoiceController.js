// src/controllers/invoiceController.js

exports.emitInvoice = async (req, res) => {
  try {
    const { orderId, customer, items, total } = req.body;

    if (!orderId || !customer || !items || !total) {
      return res.status(400).json({ error: 'Dados incompletos para emitir nota.' });
    }

    // Simulação de envio para NFE.io (futuramente vamos integrar de verdade)
    console.log('Emitindo nota fiscal para o pedido:', orderId);

    return res.status(200).json({
      message: 'Nota fiscal emitida com sucesso (simulado)',
      notaFiscalId: 'NFE123456789'
    });
  } catch (error) {
    console.error('Erro ao emitir nota fiscal:', error);
    return res.status(500).json({ error: 'Erro ao emitir nota fiscal.' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'OrderId não fornecido.' });
    }

    // Simulação: aqui você buscaria a nota no banco ou na API externa
    console.log('Consultando nota fiscal do pedido:', orderId);

    return res.status(200).json({
      orderId,
      status: 'Emitida',
      notaFiscalId: 'NFE123456789',
      dataEmissao: '2025-06-09',
      valorTotal: 100.00
    });
  } catch (error) {
    console.error('Erro ao consultar nota fiscal:', error);
    return res.status(500).json({ error: 'Erro ao consultar nota fiscal.' });
  }
};
