const mercadopago = require('mercadopago');
const axios = require('axios');

class PaymentService {
  constructor() {
    // Configurar MercadoPago
    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });
  }

  // MERCADO PAGO - PIX
  async createMercadoPagoPix(orderData) {
    try {
      const payment = {
        transaction_amount: orderData.total,
        description: `Pedido #${orderData.orderId} - ${orderData.customerName}`,
        payment_method_id: 'pix',
        payer: {
          email: orderData.customerEmail || 'cliente@exemplo.com',
          first_name: orderData.customerName,
          identification: {
            type: 'CPF',
            number: orderData.customerCPF || '11111111111'
          }
        }
      };

      const response = await mercadopago.payment.create(payment);
      
      return {
        success: true,
        payment_id: response.body.id,
        qr_code: response.body.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: response.body.point_of_interaction.transaction_data.qr_code_base64,
        status: response.body.status
      };
    } catch (error) {
      console.error('Erro MercadoPago PIX:', error);
      return { success: false, error: error.message };
    }
  }

  // MERCADO PAGO - CARTÃO
  async createMercadoPagoCard(orderData, cardData) {
    try {
      const payment = {
        transaction_amount: orderData.total,
        token: cardData.token,
        description: `Pedido #${orderData.orderId} - ${orderData.customerName}`,
        installments: cardData.installments || 1,
        payment_method_id: cardData.payment_method_id,
        issuer_id: cardData.issuer_id,
        payer: {
          email: orderData.customerEmail
        }
      };

      const response = await mercadopago.payment.create(payment);
      
      return {
        success: true,
        payment_id: response.body.id,
        status: response.body.status
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
