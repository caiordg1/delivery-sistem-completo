// src/index.js
require('dotenv').config();
const Pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const { getMenuText } = require('./flows/menu');
const { handleOrder, states: orderStates } = require('./flows/order');
const SatisfactionFlow = require('./flows/satisfactionFlow');
const AdvancedFlow = require('./flows/AdvancedFlow.js');

// Instanciar o fluxo de satisfação
const satisfactionFlow = new SatisfactionFlow();
const advancedFlow = new AdvancedFlow();

async function startBot () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({
    logger: Pino({ level: 'silent' }),
    auth: state
  });
  
  // Salva sessão
  sock.ev.on('creds.update', saveCreds);
  
  // QR & conexão
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: false });
    if (connection === 'open') {
      console.log('✅ Bot conectado com sucesso!');
    } else if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        '❌ Conexão fechada.',
        shouldReconnect ? 'Tentando reconectar…' : 'Logout detectado.'
      );
      if (shouldReconnect) startBot();
    }
  });
  
  // Mensagens
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const chatId = msg.key.remoteJid;
    const userPhone = chatId.replace('@s.whatsapp.net', '');
    const texto = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim();

    console.log('[DEBUG TOTAL] Mensagem recebida:', texto);
    console.log('[DEBUG TOTAL] Tamanho:', texto.length);
    console.log('[DEBUG TOTAL] Primeiros 50 chars:', texto.substring(0, 50));
    
    // --- PRIORIDADE 1: Verificar se está no fluxo de satisfação ---
    if (satisfactionFlow.isUserInSatisfactionFlow(userPhone)) {
      const handled = await satisfactionFlow.handleSatisfactionFlow(sock, chatId, texto, userPhone);
      if (handled) return;
    }
    
    // --- PRIORIDADE 2: Verificar se é pedido do cardápio digital ---
    if (isOrderFromCardapio(texto)) {
      await handleCardapioOrder(sock, chatId, texto, userPhone);
      return;
    }

    // --- PRIORIDADE 3: Verificar se está no fluxo avançado ---
    if (advancedFlow.isUserInFlow(userPhone)) {
      const handled = await advancedFlow.processMessage(sock, chatId, texto, userPhone);
      if (handled) return;
    }
    
    // --- PRIORIDADE 4: Se estiver no meio de um pedido ---
    if (orderStates.has(chatId)) {
      await handleOrder(sock, msg, texto.toLowerCase());
      return;
    }
    
    // --- Menu / saudação ---
    const lowerText = texto.toLowerCase();
    if (['oi', 'ola', 'olá', 'menu', 'bom dia', 'boa tarde', 'boa noite'].includes(lowerText)) {
      await sock.sendMessage(chatId, { text: getMenuText() });
      return;
    }
    
    // --- Opção 1: Cardápio ---
    if (lowerText === '1') {
      const { getFormattedMenu } = require('./flows/cardapio');
      const menuText = await getFormattedMenu();
      await sock.sendMessage(chatId, { text: menuText });
      return;
    }
    
    // --- Opção 2: Iniciar fluxo de pedido ---
    if (lowerText === '2') {
      await handleOrder(sock, msg, '');
      return;
    }
    
    // --- Opção 3: Atendente humano ---
    if (lowerText === '3') {
      await sock.sendMessage(chatId, {
        text: '📞 Ok! Um atendente humano continuará esta conversa em instantes.'
      });
      return;
    }
    
    // --- Fallback ---
    await sock.sendMessage(chatId, {
      text: 'Desculpe, não entendi. Digite *menu* para ver as opções.'
    });
  });

  // Disponibilizar sock globalmente para chamadas externas
  global.whatsappSock = sock;
  global.satisfactionFlow = satisfactionFlow;
}

// NOVA FUNÇÃO: Detecta se é pedido do cardápio digital
function isOrderFromCardapio(texto) {
  const patterns = [
    /🛒.*resumo/i,
    /resumo.*pedido/i,
    /itens.*selecionados/i,
    /🛍️.*itens.*pedido/i
  ];
  
  return patterns.some(pattern => pattern.test(texto));
}

// NOVA FUNÇÃO: Processa pedido do cardápio
async function handleCardapioOrder(sock, chatId, texto, userPhone) {
  console.log(`[${userPhone}] Processando pedido do cardápio digital`);
  
  try {
    // Extrair dados do pedido
    const orderData = parseOrderFromText(texto);
    
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      await sock.sendMessage(chatId, { 
        text: "❌ Não consegui identificar os itens do seu pedido. Pode tentar novamente?" 
      });
      return;
    }
    
    // Iniciar fluxo avançado com os dados do pedido
    advancedFlow.startFlowWithOrder(userPhone, orderData);

    // Enviar confirmação
    const confirmationMessage = formatOrderConfirmation(orderData);
    await sock.sendMessage(chatId, { text: confirmationMessage });

  } catch (error) {
    console.error('Erro ao processar pedido do cardápio:', error);
    await sock.sendMessage(chatId, { 
      text: "❌ Erro ao processar pedido. Tente novamente em alguns instantes." 
    });
  }
}

// NOVA FUNÇÃO: Extrai dados do pedido
function parseOrderFromText(texto) {
  const items = [];
  let total = 0;

  // Padrão para detectar itens: - 1x produto - R$ 30.00
  const itemPattern = /-\s*(\d+)x\s+(.+?)\s*-\s*R\$\s*([\d,\.]+)/gi;
  let match;

  while ((match = itemPattern.exec(texto)) !== null) {
    const quantity = parseInt(match[1]);
    const name = match[2].trim();
    const price = parseFloat(match[3].replace(',', '.'));

    items.push({
      name: name,
      quantity: quantity,
      price: price,
      total: quantity * price
    });

    total += quantity * price;
  }

  // Tentar extrair total do texto
  const totalPattern = /total:\s*R\$\s*([\d,\.]+)/i;
  const totalMatch = texto.match(totalPattern);
  if (totalMatch) {
    total = parseFloat(totalMatch[1].replace(',', '.'));
  }

  return {
    items: items,
    total: total,
    source: 'cardapio_digital'
  };
}

// NOVA FUNÇÃO: Formata confirmação do pedido
function formatOrderConfirmation(orderData) {
  let message = "✅ *Pedido recebido do cardápio digital!*\n\n";
  message += "📋 *Resumo do seu pedido:*\n";
  
  orderData.items.forEach(item => {
    message += `• ${item.quantity}x ${item.name} - R$ ${item.total.toFixed(2)}\n`;
  });
  
  message += `\n💰 *Total: R$ ${orderData.total.toFixed(2)}*\n\n`;
  message += "✅ Digite *SIM* para confirmar\n";
  message += "❌ Digite *NÃO* para cancelar\n\n";
  message += "Ou digite *menu* para ver outras opções";
  
  return message;
}

startBot();
