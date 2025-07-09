// src/flows/order.js
const { createOrder } = require('../services/api');

// Mapa de estados por chat
const states = new Map(); // chatId → { step, customerName, items }

function reset(chatId) {
  states.delete(chatId);
}

async function handleOrder(sock, msg, texto) {
  const chatId = msg.key.remoteJid;
  let data = states.get(chatId);

  /* ───────── Passo 0: iniciar ───────── */
  if (!data) {
    data = { step: 'askName', customerName: '', items: [] };
    states.set(chatId, data);
    await sock.sendMessage(chatId, { text: '👤 Qual é o seu nome completo?' });
    return;
  }

  /* ───────── Passo 1: receber nome ───────── */
  if (data.step === 'askName') {
    if (!texto || texto.length < 2) {
      await sock.sendMessage(chatId, { text: 'Por favor, informe um nome válido.' });
      return;
    }
    data.customerName = texto;
    data.step = 'askItems';
    await sock.sendMessage(
      chatId,
      { text: '📝 Informe o número dos itens desejados (ex.: 1 ou 1,2).' }
    );
    return;
  }

  /* ───────── Passo 2: receber itens ───────── */
  if (data.step === 'askItems') {
    const nums = texto.split(',').map(t => t.trim()).filter(Boolean);
    if (nums.length === 0) {
      await sock.sendMessage(chatId, { text: '❌ Envie pelo menos um número.' });
      return;
    }
    data.items = nums.map(n => ({ productId: n, qty: 1 })); // protótipo
    data.step = 'confirming';
    await sock.sendMessage(
      chatId,
      {
        text:
          `📋 Confirmando pedido de *${data.customerName}*\n` +
          `Itens: ${nums.join(', ')}\n` +
          'Digite *confirmar* para salvar ou *cancelar* para desistir.'
      }
    );
    return;
  }

  /* ───────── Passo 3: confirmar / cancelar ───────── */
  if (data.step === 'confirming') {
    if (texto === 'confirmar') {
      try {
        const novo = await createOrder({
          customerName: data.customerName,
          items: data.items,
          total: 0 // placeholder
        });

        // ↓ log para você ver exatamente o que o backend devolve
        console.log('↩️  Resposta createOrder:', novo);

        // tente todos os nomes de ID mais comuns
        const orderId =
  (novo.order && (novo.order._id || novo.order.id)) || // ← pega order._id
  novo._id ||
  novo.id ||
  novo.orderId ||
  novo.order_id ||
  '###';


        await sock.sendMessage(
          chatId,
          { text: `✅ Pedido *${orderId}* registrado! Obrigado.` }
        );
      } catch (err) {
        console.error('Erro ao criar pedido:', err);
        await sock.sendMessage(
          chatId,
          { text: '⚠️ Não consegui salvar seu pedido. Tente de novo mais tarde.' }
        );
      }
      reset(chatId);
      return;
    }

    if (texto === 'cancelar') {
      await sock.sendMessage(chatId, { text: '🚫 Pedido cancelado.' });
      reset(chatId);
      return;
    }

    await sock.sendMessage(chatId, {
      text: 'Por favor, responda apenas *confirmar* ou *cancelar*.'
    });
    return;
  }
}

module.exports = { handleOrder, states };
