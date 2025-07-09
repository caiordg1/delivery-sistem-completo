const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// Criar cupom
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, validUntil, usageLimit, applicableProducts, description } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Código de cupom já existe.' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      type,
      value,
      minOrder: minOrder || 0,
      maxDiscount,
      validUntil,
      usageLimit,
      applicableProducts,
      description
    });

    await coupon.save();
    res.status(201).json({ message: 'Cupom criado com sucesso!', coupon });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar cupom.', error: err.message });
  }
};

// Listar cupons
exports.listCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(filter)
      .populate('applicableProducts', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(filter);

    res.status(200).json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar cupons.', error: err.message });
  }
};

// Validar cupom
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderValue, products, userId } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado ou inativo.' });
    }

    // Verificar validade
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ message: 'Cupom expirado.' });
    }

    // Verificar limite de uso
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Cupom esgotado.' });
    }

    // Verificar valor mínimo
    if (orderValue < coupon.minOrder) {
      return res.status(400).json({ 
        message: `Pedido mínimo de R$ ${coupon.minOrder.toFixed(2)} para usar este cupom.` 
      });
    }

    // Verificar produtos aplicáveis
    if (coupon.applicableProducts.length > 0) {
      const hasValidProduct = products.some(productId => 
        coupon.applicableProducts.includes(productId)
      );
      if (!hasValidProduct) {
        return res.status(400).json({ message: 'Cupom não aplicável aos produtos selecionados.' });
      }
    }

    // Verificar restrições de usuário
    if (coupon.userRestrictions.length > 0 && !coupon.userRestrictions.includes(userId)) {
      return res.status(400).json({ message: 'Cupom não disponível para este usuário.' });
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderValue * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    res.status(200).json({
      valid: true,
      discount: discount.toFixed(2),
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao validar cupom.', error: err.message });
  }
};

// Aplicar cupom (incrementar uso)
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    coupon.usedCount += 1;
    await coupon.save();

    res.status(200).json({ message: 'Cupom aplicado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao aplicar cupom.', error: err.message });
  }
};

// Obter cupom específico
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableProducts', 'name price');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    res.status(200).json(coupon);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar cupom.', error: err.message });
  }
};

// Atualizar cupom
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    res.status(200).json({ message: 'Cupom atualizado com sucesso!', coupon });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar cupom.', error: err.message });
  }
};

// Desativar cupom
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    res.status(200).json({ message: 'Cupom desativado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao desativar cupom.', error: err.message });
  }
};

// Relatório de uso
exports.getCouponUsage = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    const orders = await Order.find({ 'coupon.code': coupon.code })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      coupon: {
        code: coupon.code,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit
      },
      orders
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar relatório.', error: err.message });
  }
};
