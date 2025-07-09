// src/flows/cardapio.js
const { fetchMenu } = require('../services/api');

/**
 * Gera o texto que será enviado ao cliente com a lista de produtos
 * Formato final:
 *  🍕 *Cardápio*
 *  1️⃣ Pizza Margherita - R$29,90
 *  2️⃣ Pizza Pepperoni  - R$34,90
 *  ...
 */
async function getFormattedMenu () {
  try {
    const items = await fetchMenu(); // [{ name, price, ... }]

    if (!Array.isArray(items) || items.length === 0) {
      return '😕 Desculpe, o cardápio está vazio no momento.';
    }

    let texto = '🍕 *Cardápio*\n';
    items.forEach((item, idx) => {
      const numero = idx + 1;
      const preco =
        typeof item.price === 'number'
          ? `R$${item.price.toFixed(2).replace('.', ',')}`
          : item.price || '';
      texto += `\n${numero}️⃣ ${item.name} - ${preco}`;
    });

    texto += '\n\nEnvie o número do item para adicionar ao pedido (em breve).';
    return texto;
  } catch (err) {
    console.error('Erro ao buscar cardápio:', err);
    return '⚠️ Não consegui carregar o cardápio agora. Tente novamente em instantes.';
  }
}

module.exports = { getFormattedMenu };
