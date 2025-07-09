// src/services/LoggiService.js - VERSÃO GRAPHQL CORRIGIDA
const axios = require('axios');

class LoggiService {
  constructor() {
    // Endpoint GraphQL correto
    this.baseURL = process.env.LOGGI_API_URL || 'https://www.loggi.com/graphql';
    this.stagingURL = 'https://staging.loggi.com/graphql';
    this.email = process.env.LOGGI_EMAIL;
    this.apiKey = process.env.LOGGI_API_KEY;
    
    // Usar staging para testes
   this.apiURL = this.baseURL; // Usar sempre produção
  }

  // Headers para autenticação GraphQL
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${this.email}:${this.apiKey}`
    };
  }

  // 1. DESCOBRIR INFORMAÇÕES DO USUÁRIO/EMPRESA
  async getUserInfo() {
    const query = `
      query {
  allCities {
    edges {
      node {
        pk
        name
        slug
      }
    }
  }
}
    `;

    try {
      const response = await axios.post(this.apiURL, {
        query: query
      }, {
        headers: this.getHeaders()
      });

      console.log('User Info Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data;
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error.response?.data || error.message);
      throw error;
    }
  }

  // 2. LISTAR CIDADES DISPONÍVEIS
  async getCities() {
    const query = `
      query {
        allCities {
          edges {
            node {
              pk
              name
              slug
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post(this.apiURL, {
        query: query
      }, {
        headers: this.getHeaders()
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data.allCities.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Erro ao listar cidades:', error.response?.data || error.message);
      throw error;
    }
  }

  // 3. CALCULAR FRETE (COTAÇÃO)
  async calculateShipping(addressFrom, addressTo, packageInfo = {}) {
    // Query GraphQL para cotação
    const query = `
      mutation estimateDelivery($input: EstimateDeliveryInput!) {
        estimateDelivery(input: $input) {
          success
          estimate {
            id
            total
            eta
            distance
            packages {
              id
              category
              pricing {
                total
                description
              }
            }
          }
          errors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        // Adaptar dados para formato GraphQL da Loggi
        origin: {
          lat: addressFrom.coordinates?.[1] || -3.7327,
          lng: addressFrom.coordinates?.[0] || -38.5434,
          address: addressFrom.fullAddress || addressFrom.address
        },
        destination: {
          lat: addressTo.coordinates?.[1] || -3.7500,
          lng: addressTo.coordinates?.[0] || -38.5200,
          address: addressTo.fullAddress || addressTo.address
        },
        packages: [{
          category: packageInfo.category || 'package',
          size: packageInfo.size || 'S',
          weight: packageInfo.weight || 1
        }]
      }
    };

    try {
      const response = await axios.post(this.apiURL, {
        query: query,
        variables: variables
      }, {
        headers: this.getHeaders()
      });

      console.log('Estimate Response:', JSON.stringify(response.data, null, 2));

      if (response.data.errors) {
        console.error('GraphQL Errors:', response.data.errors);
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      const result = response.data.data.estimateDelivery;
      
      if (!result.success) {
        throw new Error(`Estimation failed: ${JSON.stringify(result.errors)}`);
      }

      return {
        success: true,
        quotes: result.estimate ? [{
          id: result.estimate.id,
          price: result.estimate.total / 100, // Converter centavos para reais
          estimatedTime: result.estimate.eta,
          distance: result.estimate.distance,
          provider: 'loggi',
          description: result.estimate.packages?.[0]?.pricing?.description || 'Entrega Loggi'
        }] : [],
        recommended: result.estimate ? result.estimate.id : null
      };

    } catch (error) {
      console.error('Erro ao calcular frete Loggi:', error.response?.data || error.message);
      
      // Retornar resposta padrão em caso de erro
      return {
        success: false,
        quotes: [],
        recommended: null,
        error: error.message
      };
    }
  }

  // 4. CRIAR ENTREGA
  async createDelivery(estimateId, deliveryData) {
    const query = `
      mutation createOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          success
          order {
            id
            trackingKey
            status
          }
          errors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        estimateId: estimateId,
        recipient: {
          name: deliveryData.recipientName,
          phone: deliveryData.phone,
          instructions: deliveryData.instructions || ''
        }
      }
    };

    try {
      const response = await axios.post(this.apiURL, {
        query: query,
        variables: variables
      }, {
        headers: this.getHeaders()
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data.createOrder;
    } catch (error) {
      console.error('Erro ao criar entrega:', error.response?.data || error.message);
      throw error;
    }
  }

  // 5. RASTREAR ENTREGA
  async trackDelivery(trackingKey) {
    const query = `
      query getOrder($trackingKey: String!) {
        order(trackingKey: $trackingKey) {
          id
          status
          trackingKey
          eta
          courier {
            name
            phone
            location {
              lat
              lng
            }
          }
          waypoints {
            id
            address
            status
            eta
          }
        }
      }
    `;

    const variables = {
      trackingKey: trackingKey
    };

    try {
      const response = await axios.post(this.apiURL, {
        query: query,
        variables: variables
      }, {
        headers: this.getHeaders()
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data.order;
    } catch (error) {
      console.error('Erro ao rastrear entrega:', error.response?.data || error.message);
      throw error;
    }
  }

  // 6. CANCELAR ENTREGA
  async cancelDelivery(orderId) {
    const query = `
      mutation cancelOrder($orderId: ID!) {
        cancelOrder(orderId: $orderId) {
          success
          errors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      orderId: orderId
    };

    try {
      const response = await axios.post(this.apiURL, {
        query: query,
        variables: variables
      }, {
        headers: this.getHeaders()
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
      }

      return response.data.data.cancelOrder;
    } catch (error) {
      console.error('Erro ao cancelar entrega:', error.response?.data || error.message);
      throw error;
    }
  }

  // 7. MÉTODO PARA TESTAR CONEXÃO
  async testConnection() {
    try {
      console.log('🧪 Testando conexão GraphQL Loggi...');
      console.log('📡 URL:', this.apiURL);
      console.log('📧 Email:', this.email);
      console.log('🔑 API Key:', this.apiKey ? '***' + this.apiKey.slice(-4) : 'NÃO CONFIGURADA');

      const userInfo = await this.getUserInfo();
      console.log('✅ Conexão bem-sucedida!');
      console.log('👤 Usuário:', userInfo.me);
      return userInfo;
    } catch (error) {
      console.error('❌ Falha na conexão:', error.message);
      throw error;
    }
  }
}

module.exports = new LoggiService();
