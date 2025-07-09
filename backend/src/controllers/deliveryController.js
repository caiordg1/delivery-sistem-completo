const loggiService = require('../services/loggiService');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');

class DeliveryController {
  
  // COTAÇÃO DE FRETE
  async getQuote(req, res) {
    try {
      const { addressFrom, addressTo, packageInfo, providers = ['loggi'] } = req.body;

      if (!addressFrom || !addressTo) {
        return res.status(400).json({
          success: false,
          error: 'Endereços de origem e destino são obrigatórios'
        });
      }

      const quotes = [];

      if (providers.includes('loggi')) {
        const loggiQuote = await loggiService.calculateShipping(
          addressFrom, 
          addressTo, 
          packageInfo || {}
        );
        quotes.push(loggiQuote);
      }

      const validQuotes = quotes.filter(q => q.success);
      validQuotes.sort((a, b) => a.price - b.price);

      res.json({
        success: true,
        quotes: validQuotes,
        recommended: validQuotes[0] || null,
        requestId: `quote_${Date.now()}`
      });

    } catch (error) {
      console.error('Erro ao obter cotação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // CRIAR ENTREGA
  async requestDelivery(req, res) {
    try {
      const { orderId, estimateId, provider = 'loggi', addressFrom, addressTo, packageInfo } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Pedido não encontrado'
        });
      }

      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery && existingDelivery.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Já existe uma entrega ativa para este pedido'
        });
      }

      let deliveryResult;

      switch (provider) {
        case 'loggi':
          deliveryResult = await loggiService.createDelivery({
            _id: orderId,
            externalId: order.orderNumber
          }, estimateId);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Provedor de entrega não suportado'
          });
      }

      if (!deliveryResult.success) {
        return res.status(400).json(deliveryResult);
      }

      const delivery = new Delivery({
        orderId: order._id,
        provider: provider,
        externalId: deliveryResult.deliveryId,
        trackingCode: deliveryResult.trackingCode,
        status: deliveryResult.status,
        estimatedDelivery: deliveryResult.estimatedDelivery,
        deliveryFee: deliveryResult.cost,
        addressFrom: addressFrom,
        addressTo: addressTo,
        packageInfo: packageInfo,
        courierInfo: deliveryResult.courierInfo,
        providerData: deliveryResult
      });

      await delivery.save();

      order.deliveryStatus = deliveryResult.status;
      order.trackingCode = deliveryResult.trackingCode;
      await order.save();

      res.status(201).json({
        success: true,
        delivery: delivery,
        message: 'Entrega criada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // RASTREAR ENTREGA
  async trackDelivery(req, res) {
    try {
      const { orderId } = req.params;
      const { trackingCode } = req.query;

      let delivery;

      if (orderId) {
        delivery = await Delivery.findOne({ orderId }).populate('orderId');
      } else if (trackingCode) {
        delivery = await Delivery.findOne({ trackingCode }).populate('orderId');
      } else {
        return res.status(400).json({
          success: false,
          error: 'orderId ou trackingCode é obrigatório'
        });
      }

      if (!delivery) {
        return res.status(404).json({
          success: false,
          error: 'Entrega não encontrada'
        });
      }

      let trackingResult;

      switch (delivery.provider) {
        case 'loggi':
          trackingResult = await loggiService.trackDelivery(delivery.externalId);
          break;
        
        default:
          trackingResult = {
            success: false,
            error: 'Provedor não suportado'
          };
      }

      if (trackingResult.success) {
        if (delivery.status !== trackingResult.status) {
          delivery.status = trackingResult.status;
          delivery.courierInfo = trackingResult.courierInfo;
          delivery.actualDelivery = trackingResult.actualDelivery;
          delivery.updatedAt = new Date();
          await delivery.save();

          if (delivery.orderId) {
            delivery.orderId.deliveryStatus = trackingResult.status;
            await delivery.orderId.save();
          }
        }

        res.json({
          success: true,
          tracking: {
            orderId: delivery.orderId?._id,
            orderNumber: delivery.orderId?.orderNumber,
            trackingCode: delivery.trackingCode,
            status: trackingResult.status,
            estimatedDelivery: delivery.estimatedDelivery,
            actualDelivery: trackingResult.actualDelivery,
            courierInfo: trackingResult.courierInfo,
            currentLocation: trackingResult.currentLocation,
            timeline: trackingResult.timeline,
            provider: delivery.provider
          }
        });
      } else {
        res.status(400).json(trackingResult);
      }

    } catch (error) {
      console.error('Erro ao rastrear entrega:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // CANCELAR ENTREGA
  async cancelDelivery(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const delivery = await Delivery.findOne({ orderId }).populate('orderId');
      
      if (!delivery) {
        return res.status(404).json({
          success: false,
          error: 'Entrega não encontrada'
        });
      }

      if (['delivered', 'cancelled'].includes(delivery.status)) {
        return res.status(400).json({
          success: false,
          error: 'Entrega não pode ser cancelada neste status'
        });
      }

      let cancelResult;

      switch (delivery.provider) {
        case 'loggi':
          cancelResult = await loggiService.cancelDelivery(delivery.externalId, reason);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Provedor não suportado'
          });
      }

      if (cancelResult.success) {
        delivery.status = 'cancelled';
        delivery.cancelledAt = new Date();
        delivery.cancellationReason = reason;
        await delivery.save();

        if (delivery.orderId) {
          delivery.orderId.deliveryStatus = 'cancelled';
          await delivery.orderId.save();
        }

        res.json({
          success: true,
          message: 'Entrega cancelada com sucesso',
          refund: cancelResult.refund
        });
      } else {
        res.status(400).json(cancelResult);
      }

    } catch (error) {
      console.error('Erro ao cancelar entrega:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // LISTAR ENTREGAS
  async listDeliveries(req, res) {
    try {
      const { page = 1, limit = 20, status, provider, startDate, endDate } = req.query;

      const query = {};
      
      if (status) query.status = status;
      if (provider) query.provider = provider;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const deliveries = await Delivery.find(query)
        .populate('orderId', 'orderNumber totalAmount customer')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Delivery.countDocuments(query);

      res.json({
        success: true,
        deliveries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao listar entregas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new DeliveryController();
