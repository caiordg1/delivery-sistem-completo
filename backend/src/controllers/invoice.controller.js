// Função para consultar nota fiscal simulada
exports.getInvoice = (req, res) => {
  const orderId = req.params.orderId;

  // Aqui você pode colocar a lógica real para buscar no banco
  // Por enquanto, vamos simular uma nota existente:
  const notaFiscalSimulada = {
    orderId,
    notaFiscalId: 'NFE123456789',
    status: 'Emitida',
    total: 100.00,
    customer: {
      name: 'Cliente Teste',
    },
    items: [
      { product: 'Produto A', qty: 2, price: 50.00 },
    ],
    issuedAt: new Date().toISOString(),
  };

  return res.json(notaFiscalSimulada);
};
