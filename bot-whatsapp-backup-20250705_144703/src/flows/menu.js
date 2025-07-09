// src/flows/menu.js
function getMenuText () {
  return (
    '👋 *Bem-vindo ao ' +
    (process.env.STORE_NAME || 'nosso restaurante') +
    '*\n\n' +
    '🍕 *1*. Ver cardápio\n' +
    '🛒 *2*. Fazer pedido\n' +
    '📞 *3*. Falar com atendente\n\n' +
    '*Envie o número da opção desejada.*'
  );
}

module.exports = { getMenuText };
