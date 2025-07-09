const MenuItem = require('../models/MenuItem');

exports.getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json({ success: true, produtos: items });
  } catch (error) {
    console.error('Erro ao buscar itens do menu:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};
// Criar produto
exports.createProduct = async (req, res) => {
  try {
    const product = new MenuItem(req.body);
    await product.save();
    res.json({ success: true, produto: product });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

// Atualizar produto
exports.updateProduct = async (req, res) => {
  try {
    const product = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, produto: product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};

// Deletar produto
exports.deleteProduct = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Produto deletado' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
};
