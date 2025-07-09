const Fidelity = require('../models/Fidelity');

exports.createFidelity = async (req, res) => {
  try {
    const { userId, points } = req.body;
    const record = new Fidelity({ userId, points });
    await record.save();
    res.status(201).json({ message: 'Fidelidade registrada!', record });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar fidelidade.', error: err.message });
  }
};

exports.getFidelity = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Fidelity.find({ userId });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar fidelidade.', error: err.message });
  }
};
