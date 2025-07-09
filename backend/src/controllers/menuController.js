const MenuItem = require('../models/MenuItem');

// Listar itens do cardápio
exports.getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar itens do cardápio', error: err.message });
  }
};

// Adicionar novo item no cardápio
exports.addMenuItem = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const newItem = new MenuItem({ name, description, price });
    await newItem.save();
    res.status(201).json({ message: 'Item adicionado ao cardápio', item: newItem });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao adicionar item', error: err.message });
  }
};
