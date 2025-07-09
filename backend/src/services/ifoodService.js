// Serviço básico iFood Sob Demanda
const axios = require('axios');

class IfoodService {
  constructor() {
    this.baseURL = process.env.IFOOD_API_URL || 'https://developer.ifood.com.br/api/v2';
    this.apiKey = process.env.IFOOD_API_KEY;
  }

  async calculateShipping(addressFrom, addressTo, packageInfo) {
    // Implementação básica para sob demanda
    return {
      success: true,
      provider: 'ifood',
      price: 12.99, // Valor estimado
      estimatedTime: 45, // 45 minutos
      message: 'Estimativa iFood Sob Demanda'
    };
  }
}

module.exports = new IfoodService();
