// delivery-system/backend/src/services/loggiService.js

const axios = require('axios');

class LoggiService {
  constructor() {
    this.baseURL = process.env.LOGGI_API_URL || 'https://www.loggi.com/api/v2';
    this.apiKey = process.env.LOGGI_API_KEY;
    this.email = process.env.LOGGI_EMAIL;
    this.companyId = process.env.LOGGI_COMPANY_ID;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `ApiKey ${this.email}:${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // COTAÇÃO DE FRETE
  async calculateShipping(addressFrom, addressTo, packageInfo) {
    try {
      const payload = {
        shops: [{
          pk: this.companyId,
          name: "Delivery System",
          address: {
            pos: addressFrom.coordinates,
            address: addressFrom.fullAddress,
            complement: addressFrom.complement || '',
            city: addressFrom.city,
            state: addressFrom.state,
            country: addressFrom.country || 'BR'
          }
        }],
        packages: [{
          recipient: {
            name: addressTo.recipientName,
            phone: addressTo.phone,
            email: addressTo.email || ''
          },
          address: {
            pos: addressTo.coordinates,
            address: addressTo.fullAddress,
            complement: addressTo.complement || '',
            city: addressTo.city,
            state: addressTo.state,
            country: addressTo.country || 'BR'
          },
          charge: packageInfo.totalValue || 0,
          dimensions: {
            width: packageInfo.width || 20,
            height: packageInfo.height || 15,
            length: packageInfo.length || 30,
            weight: packageInfo.weight || 1
          },
          instructions: packageInfo.instructions || 'Entrega de delivery de comida'
        }]
      };

      const response = await this.client.post('/estimate/', payload);
      
      if (response.data.success) {
        const estimate = response.data.estimates[0];
        return {
          success: true,
          estimateId: estimate.pk,
          price: estimate.pricing.total,
          currency: estimate.pricing.currency,
          estimatedTime: estimate.eta.total_time,
          distance: estimate.normal_route_distance_km,
          provider: 'loggi',
          details: {
            pickupTime: estimate.eta.pickup,
            deliveryTime: estimate.eta.delivery,
            route: estimate.route
          }
        };
      } else {
        throw new Error(response.data.error || 'Erro na cotação Loggi');
      }
    } catch (error) {
      console.error('Erro ao calcular frete Loggi:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        provider: 'loggi'
      };
    }
  }

  // CRIAR ENTREGA
  async createDelivery(orderData, estimateId) {
    try {
      const payload = {
        estimate_pk: estimateId,
        payment_method: 'balance',
        is_scheduled: false,
        external_id: orderData.externalId || orderData._id
      };

      const response = await this.client.post('/orders/', payload);

      if (response.data.success) {
        const order = response.data.order;
        return {
          success: true,
          deliveryId: order.pk,
          trackingCode: order.tracking_key,
          status: this.mapLoggiStatus(order.status),
          estimatedDelivery: new Date(order.eta_delivery),
          courierInfo: order.driver ? {
            name: order.driver.first_name,
            phone: order.driver.phone,
            location: order.driver.current_pos
          } : null,
          cost: order.pricing.total,
          provider: 'loggi'
        };
      } else {
        throw new Error(response.data.error || 'Erro ao criar entrega Loggi');
      }
    } catch (error) {
      console.error('Erro ao criar entrega Loggi:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        provider: 'loggi'
      };
    }
  }

  // RASTREAR ENTREGA
  async trackDelivery(deliveryId) {
    try {
      const response = await this.client.get(`/orders/${deliveryId}/`);

      if (response.data) {
        const order = response.data;
        return {
          success: true,
          deliveryId: order.pk,
          trackingCode: order.tracking_key,
          status: this.mapLoggiStatus(order.status),
          currentLocation: order.driver?.current_pos || null,
          estimatedDelivery: new Date(order.eta_delivery),
          actualDelivery: order.delivered_at ? new Date(order.delivered_at) : null,
          courierInfo: order.driver ? {
            name: order.driver.first_name,
            phone: order.driver.phone,
            photo: order.driver.photo,
            vehicle: order.driver.vehicle_type
          } : null,
          timeline: order.timeline || [],
          provider: 'loggi'
        };
      }
    } catch (error) {
      console.error('Erro ao rastrear entrega Loggi:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        provider: 'loggi'
      };
    }
  }

  // CANCELAR ENTREGA
  async cancelDelivery(deliveryId, reason = 'Cancelamento solicitado pelo cliente') {
    try {
      const payload = { reason: reason };
      const response = await this.client.post(`/orders/${deliveryId}/cancel/`, payload);

      if (response.data.success) {
        return {
          success: true,
          deliveryId: deliveryId,
          status: 'cancelled',
          cancelledAt: new Date(),
          refund: response.data.refund_amount || 0,
          provider: 'loggi'
        };
      } else {
        throw new Error(response.data.error || 'Erro ao cancelar entrega');
      }
    } catch (error) {
      console.error('Erro ao cancelar entrega Loggi:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        provider: 'loggi'
      };
    }
  }

  // MAPEAR STATUS
  mapLoggiStatus(loggiStatus) {
    const statusMap = {
      'new': 'pending',
      'searching': 'searching',
      'accepted': 'accepted',
      'started': 'pickup',
      'collected': 'in_transit',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'failed': 'failed',
      'returned': 'cancelled'
    };
    return statusMap[loggiStatus] || 'pending';
  }

  // VALIDAR ENDEREÇO
  async validateAddress(address) {
    try {
      const response = await this.client.post('/address/validate/', {
        address: address.fullAddress,
        city: address.city,
        state: address.state
      });

      return {
        success: response.data.valid,
        coordinates: response.data.coordinates,
        formattedAddress: response.data.formatted_address,
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Erro ao validar endereço:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new LoggiService();
