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
  await sock.sendMessage(chatId, { 
    text: "🍕 *Nosso Cardápio Digital*\n\nAcesse nosso cardápio completo pelo link:\n\n👉 cardapio.fortalcar.com\n\nLá você pode:\n• Ver todos os produtos\n• Montar seu pedido\n• Finalizar direto no WhatsApp\n\nOu digite *2* para fazer pedido por aqui mesmo!" 
  });
  return;
}
    
   // --- Opção 2: Iniciar fluxo de pedido com verificação de cliente ---
if (lowerText === '2') {
  await handleNewOrderWithCheck(sock, chatId, userPhone);
  return;
}
    
   // --- Opção 3: Repetir último pedido ---
if (lowerText === '3') {
  await handleRepeatLastOrder(sock, chatId, userPhone);
  return;
}

// --- Opção 4: Atendente humano ---
if (lowerText === '4') {
  await sock.sendMessage(chatId, {
    text: '👨‍💼 *Transferindo para atendimento humano...*\n\nUm de nossos atendentes entrará em contato em breve! 😊\n\nObrigado pela paciência! ❤️'
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
    /🍕.*itens.*pedido/i
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
    
    await handleOrderFromMenuWithCheck(sock, chatId, userPhone, orderData);

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

  // 🆕 FUNÇÃO MANTIDA: Repetir último pedido com dados reais (OPÇÃO 3)
async function handleRepeatLastOrder(sock, chatId, userPhone) {
  try {
    console.log(`[REPEAT ORDER] Buscando último pedido para: ${userPhone}`);
    
    // Importar a função da API - MANTÉM getLastOrder para repetir pedido
    const { getLastOrder } = require('./services/api');
    
    // Buscar último pedido
    const lastOrder = await getLastOrder(userPhone);
    
    if (!lastOrder) {
      await sock.sendMessage(chatId, {
        text: '😅 *Ainda não encontrei pedidos anteriores seus.*\n\nVamos fazer seu primeiro pedido?\n\nDigite *2* para começar! 🍕'
      });
      return;
    }
    
    // Montar mensagem com último pedido
    let repeatMessage = `🔄 *Seu último pedido foi:*\n\n`;
    repeatMessage += `📅 *Data:* ${formatDate(lastOrder.createdAt)}\n\n`;
    repeatMessage += `📋 *Itens:*\n`;
    
    // Mostrar itens do último pedido
    if (lastOrder.items && lastOrder.items.length > 0) {
      lastOrder.items.forEach(item => {
        const itemTotal = item.total || (item.quantity * item.price);
        repeatMessage += `• ${item.quantity}x ${item.name} - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
      });
    }
    
    repeatMessage += `\n💰 *Total: R$ ${lastOrder.total.toFixed(2).replace('.', ',')}*\n`;
    repeatMessage += `📍 *Endereço:* ${lastOrder.customerAddress}\n\n`;
    
    if (lastOrder.observations) {
      repeatMessage += `📝 *Observações:* ${lastOrder.observations}\n\n`;
    }
    
    repeatMessage += `*Quer repetir esse pedido?* 😋\n\n`;
    repeatMessage += `✅ Digite *SIM* para repetir\n`;
    repeatMessage += `❌ Digite *NÃO* para fazer outro\n\n`;
    repeatMessage += `💡 Usaremos os mesmos dados de entrega!`;
    
    // Preparar dados para repetição no fluxo avançado
    const orderData = {
      items: lastOrder.items || [],
      total: lastOrder.total || 0,
      source: 'repeat_order'
    };
    
    const customerData = {
      name: lastOrder.customerName,
      address: lastOrder.customerAddress,
      observations: lastOrder.observations || ''
    };
    
    // Iniciar fluxo de repetição
    advancedFlow.startFlowWithOrder(userPhone, orderData);
    
    await sock.sendMessage(chatId, { text: repeatMessage });
    
  } catch (error) {
    console.error('[REPEAT ORDER] Erro:', error);
    await sock.sendMessage(chatId, {
      text: '😅 *Ops! Não consegui buscar seu último pedido.*\n\nQue tal fazer um novo pedido?\n\nDigite *2* para começar! 🍕'
    });
  }
}

// Função auxiliar para formatar data
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

   // 🆕 FUNÇÃO CORRIGIDA: Fluxo expresso para OPÇÃO 2 (dados pessoais)
async function handleNewOrderWithCheck(sock, chatId, userPhone) {
  try {
    console.log(`[NEW ORDER CHECK] Verificando cliente: ${userPhone}`);
    
    // Importar a NOVA função da API - getCustomerByPhone para dados pessoais
    const { getCustomerByPhone } = require('./services/api');
    
    // Buscar cliente cadastrado para obter APENAS dados pessoais
    const customer = await getCustomerByPhone(userPhone);
    
    if (customer && customer.customerName && customer.customerAddress) {
      // Cliente existe com dados completos - Fluxo Expresso
      console.log(`[NEW ORDER CHECK] Cliente encontrado: ${customer.customerName}`);
      
      let expressMessage = `⚡ *Fluxo Expresso Ativado!* 🚀\n\n`;
      expressMessage += `Que bom te ver de novo! Vamos usar seus dados salvos?\n\n`;
      expressMessage += `👤 *Nome:* ${customer.customerName}\n`;
      expressMessage += `📍 *Endereço:* ${customer.customerAddress}\n\n`;
      expressMessage += `*Confirma esses dados?*\n\n`;
      expressMessage += `✅ Digite *SIM* para confirmar\n`;
      expressMessage += `📝 Digite *NÃO* para alterar dados\n\n`;
      expressMessage += `💡 Confirmar vai acelerar seu pedido! 😊`;
      
      // Iniciar fluxo expresso no AdvancedFlow
      advancedFlow.startExpressFlow(userPhone, {
        name: customer.customerName,
        address: customer.customerAddress,
        observations: customer.observations || ''
      });
      
      await sock.sendMessage(chatId, { text: expressMessage });
      
    } else {
      // Cliente não existe ou dados incompletos - Fluxo Normal
      console.log(`[NEW ORDER CHECK] Cliente novo ou dados incompletos`);
      
      advancedFlow.startDirectOrder(userPhone);
      await sock.sendMessage(chatId, {
        text: "🛒 *Vamos fazer seu pedido!*\n\n👤 Para começar, qual seu *nome completo*?\n\nFico feliz em te atender! 🤗\n\n💡 Digite *voltar* para voltar ao menu"
      });
    }
    
  } catch (error) {
    console.error('[NEW ORDER CHECK] Erro:', error);
    
    // Fallback para fluxo normal se der erro
    advancedFlow.startDirectOrder(userPhone);
    await sock.sendMessage(chatId, {
      text: "🛒 *Vamos fazer seu pedido!*\n\n👤 Para começar, qual seu *nome completo*?\n\n💡 Digite *voltar* para voltar ao menu"
    });
  }
}

  // 🆕 FUNÇÃO CORRIGIDA: Fluxo expresso para pedidos do cardápio
async function handleOrderFromMenuWithCheck(sock, chatId, userPhone, orderData) {
  try {
    console.log(`[MENU ORDER CHECK] Verificando cliente para pedido do cardápio: ${userPhone}`);
    
    // Importar a NOVA função da API - getCustomerByPhone para dados pessoais
    const { getCustomerByPhone } = require('./services/api');
    const customer = await getCustomerByPhone(userPhone);
    
    if (customer && customer.customerName && customer.customerAddress) {
      // Cliente existe - Fluxo Expresso com dados do pedido
      console.log(`[MENU ORDER CHECK] Cliente encontrado: ${customer.customerName}`);
      
      let expressMessage = `⚡ *Fluxo Expresso Ativado!* 🚀\n\n`;
      expressMessage += `Que bom te ver de novo! Vamos usar seus dados salvos?\n\n`;
      expressMessage += `👤 *Nome:* ${customer.customerName}\n`;
      expressMessage += `📍 *Endereço:* ${customer.customerAddress}\n\n`;
      expressMessage += `*Confirma esses dados?*\n\n`;
      expressMessage += `✅ Digite *SIM* para confirmar\n`;
      expressMessage += `📝 Digite *NÃO* para alterar dados\n\n`;
      expressMessage += `💡 Confirmar vai acelerar seu pedido! 😊`;
      
      // Iniciar fluxo expresso no AdvancedFlow com dados do pedido
      advancedFlow.startExpressFlowWithOrder(userPhone, {
        name: customer.customerName,
        address: customer.customerAddress,
        observations: customer.observations || ''
      }, orderData);
      
      await sock.sendMessage(chatId, { text: expressMessage });
      
    } else {
      // Cliente novo - fluxo normal
      console.log(`[MENU ORDER CHECK] Cliente novo - fluxo normal`);
      advancedFlow.startFlowWithOrder(userPhone, orderData);
      
      const confirmationMessage = formatOrderConfirmation(orderData);
      await sock.sendMessage(chatId, { text: confirmationMessage });
    }
    
  } catch (error) {
    console.error('[MENU ORDER CHECK] Erro:', error);
    // Fallback para fluxo normal
    advancedFlow.startFlowWithOrder(userPhone, orderData);
    const confirmationMessage = formatOrderConfirmation(orderData);
    await sock.sendMessage(chatId, { text: confirmationMessage });
  }
}

startBot();
