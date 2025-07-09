const mercadopago = require('mercadopago');
const axios = require('axios');

class PaymentService {
     constructor() {
  // Configurar MercadoPago
  mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
   });
   this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
 }

  // MERCADO PAGO - PIX
  async createMercadoPagoPix(orderData) {
  try {
    console.log('Criando PIX para:', orderData);

    // Por enquanto, vamos simular um PIX válido
    const pixCode = `00020126580014BR.GOV.BCB.PIX2536api.mercadopago.com/checkout/pix/v1/${Date.now()}5204000053039865802BR5913MERCADO PAGO6014SAO PAULO61088540-090629500014BR.GOV.BCB.PIX2527${Date.now()}63043D72`;
    
    console.log('PIX criado com sucesso - código:', pixCode.substring(0, 50) + '...');

    return {
      success: true,
      payment_id: 'pix_' + Date.now(),
      qr_code: pixCode,
      qr_code_base64: Buffer.from(pixCode).toString('base64'),
      status: 'pending'
    };
  } catch (error) {
    console.error('Erro PIX:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao criar pagamento PIX'
    };
  }
}
  // MERCADO PAGO - CARTÃO
  async createMercadoPagoCard(orderData, cardData) {
    try {
     // Para ambiente de teste, simular pagamento aprovado
console.log('Simulando pagamento com cartão para:', orderData);
console.log('Dados do cartão recebidos:', cardData);

const paymentId = 'card_test_' + Date.now();

console.log('Cartão aprovado com sucesso - ID:', paymentId);
      // const response = await mercadopago.payment.create(payment);
      
     return {
  success: true,
  payment_id: paymentId,
  status: 'approved'
};
    } catch (error) {
      console.error('Erro MercadoPago Cartão:', error);
      return { success: false, error: error.message };
    }
  }

  // PICPAY
  async createPicPayPayment(orderData) {
    try {
      const picpayData = {
        referenceId: `pedido-${orderData.orderId}`,
        callbackUrl: `${process.env.BASE_URL}/api/payments/picpay/callback`,
        returnUrl: `${process.env.BASE_URL}/pedido-confirmado`,
        value: orderData.total,
        buyer: {
          firstName: orderData.customerName.split(' ')[0],
          lastName: orderData.customerName.split(' ').slice(1).join(' '),
          document: orderData.customerCPF || '11111111111',
          email: orderData.customerEmail || 'cliente@exemplo.com',
          phone: orderData.customerPhone || '11999999999'
        }
      };

      const response = await axios.post('https://appws.picpay.com/ecommerce/public/payments', picpayData, {
        headers: {
          'Content-Type': 'application/json',
          'x-picpay-token': process.env.PICPAY_X_PICPAY_TOKEN
        }
      });

      return {
        success: true,
        payment_url: response.data.paymentUrl,
        reference_id: response.data.referenceId,
        qr_code: response.data.qrcode?.content,
        expires_at: response.data.expiresAt
      };
    } catch (error) {
      console.error('Erro PicPay:', error);
      return { success: false, error: error.message };
    }
  }

  // PAGSEGURO
  async createPagSeguroPayment(orderData) {
    try {
      const pagseguroData = {
        email: process.env.PAGSEGURO_EMAIL,
        token: process.env.PAGSEGURO_TOKEN,
        currency: 'BRL',
        itemId1: '001',
        itemDescription1: `Pedido #${orderData.orderId}`,
        itemAmount1: orderData.total.toFixed(2),
        itemQuantity1: 1,
        reference: `pedido-${orderData.orderId}`,
        senderName: orderData.customerName,
        senderEmail: orderData.customerEmail || 'cliente@exemplo.com',
        senderPhone: orderData.customerPhone || '11999999999',
        redirectURL: `${process.env.BASE_URL}/pedido-confirmado`,
        notificationURL: `${process.env.BASE_URL}/api/payments/pagseguro/callback`
      };

      const response = await axios.post('https://ws.pagseguro.uol.com.br/v2/checkout', 
        new URLSearchParams(pagseguroData), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // PagSeguro retorna XML, extrair código de checkout
      const checkoutCode = response.data.match(/<code>(.*?)<\/code>/)?.[1];
      
      return {
        success: true,
        checkout_code: checkoutCode,
        payment_url: `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`,
        reference_id: pagseguroData.reference
      };
    } catch (error) {
      console.error('Erro PagSeguro:', error);
      return { success: false, error: error.message };
    }
  }

  // VERIFICAR STATUS DO PAGAMENTO
  async checkPaymentStatus(paymentId, provider) {
    try {
      switch (provider) {
        case 'mercadopago':
          const mpResponse = await mercadopago.payment.findById(paymentId);
          return {
            success: true,
            status: mpResponse.body.status,
            provider: 'mercadopago'
          };

        case 'picpay':
          const picpayResponse = await axios.get(`https://appws.picpay.com/ecommerce/public/payments/${paymentId}/status`, {
            headers: {
              'x-picpay-token': process.env.PICPAY_X_PICPAY_TOKEN
            }
          });
          return {
            success: true,
            status: picpayResponse.data.status,
            provider: 'picpay'
          };
         case 'pagseguro':
          const pagseguroResponse = await axios.get(`https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${paymentId}`, {
            params: {
              email: process.env.PAGSEGURO_EMAIL,
              token: process.env.PAGSEGURO_TOKEN
            }
          });
          return {
            success: true,
            status: pagseguroResponse.data.status,
            provider: 'pagseguro'
          };

        default:
          return { success: false, error: 'Provider não suportado' };
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PaymentService();
