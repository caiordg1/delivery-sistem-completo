const Cashback = require('../models/Cashback');

// Criar cashback para usuário
exports.createCashback = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const cashback = new Cashback({ userId, amount });
    await cashback.save();
    res.status(201).json({ message: 'Cashback criado!', cashback });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar cashback.', error: err.message });
  }
};

// Listar cashbacks de um usuário
exports.listUserCashbacks = async (req, res) => {
  try {
    const { userId } = req.params;
    const cashbacks = await Cashback.find({ userId });
    res.status(200).json(cashbacks);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar cashbacks.', error: err.message });
  }
};
