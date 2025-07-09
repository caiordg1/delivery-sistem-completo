const moment = require('moment');

const formatCurrency = (value) => {
  return `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;
};

const orderTicketTemplate = (order) => {
  let template = '';
  
  // Cabeçalho
  template += '========================================\n';
  template += '           🍕 DELIVERY SYSTEM\n';
  template += '========================================\n';
  template += `Pedido: #${order.orderNumber || order._id.toString().slice(-6)}     Data: ${moment().format('DD/MM/YYYY')}\n`;
  template += `Hora: ${moment().format('HH:mm')}               Status: ${order.status}\n`;
  template += '----------------------------------------\n';
  
  // Cliente
  if (order.customer) {
    template += `CLIENTE: ${order.customer.name || 'Cliente'}\n`;
    template += `TELEFONE: ${order.customer.phone || order.customerPhone || 'Não informado'}\n`;
  }
  
  if (order.deliveryAddress) {
    template += `ENDEREÇO: ${order.deliveryAddress}\n`;
  } else if (order.customerAddress) {
    template += `ENDEREÇO: ${order.customerAddress}\n`;
  }
  
  template += '========================================\n';
  template += '                 ITENS\n';
  template += '========================================\n';
  
  // Itens do pedido
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const itemName = item.name || (item.product && item.product.name) || 'Item';
      const itemPrice = item.price || (item.product && item.product.price) || 0;
      template += `${item.quantity}x ${itemName}     ${formatCurrency(itemPrice * item.quantity)}\n`;
      if (item.observation) {
        template += `   ⚠️  OBS: ${item.observation}\n`;
      }
      template += '\n';
    });
  }
  
  // Totais
  template += '----------------------------------------\n';
  template += `SUBTOTAL:                    ${formatCurrency(order.subtotal)}\n`;
  if (order.deliveryFee && order.deliveryFee > 0) {
    template += `TAXA ENTREGA:                ${formatCurrency(order.deliveryFee)}\n`;
  }
  if (order.discount && order.discount > 0) {
    template += `DESCONTO:                   -${formatCurrency(order.discount)}\n`;
  }
  template += '----------------------------------------\n';
  template += `TOTAL:                       ${formatCurrency(order.total)}\n`;
  template += `PAGAMENTO: ${order.paymentMethod || 'Não definido'} ${order.paymentStatus === 'paid' ? '✅' : '⏳'}\n`;
  template += '========================================\n';
  
  if (order.orderNotes) {
    template += `📱 OBSERVAÇÕES: ${order.orderNotes}\n`;
    template += '========================================\n';
  }
  
  return template;
};

module.exports = orderTicketTemplate;
