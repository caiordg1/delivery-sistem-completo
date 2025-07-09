const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.registerUser = async (req, res) => {
    const { name, email, password, role, telefone, endereco, dataNascimento } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ 
  name, 
  email, 
  password: hashedPassword, 
  role,
  telefone,
  endereco,
  dataNascimento 
});
    await newUser.save();
    
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar usuário.', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
  }
};

// NOVAS FUNÇÕES ADICIONADAS:

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, telefone, endereco, dataNascimento, password } = req.body;
    const updateData = { name, email, telefone, endereco, dataNascimento };
    
    // Se estiver atualizando senha, criptografar
    if (password && password.trim() !== '') {
     updateData.password = await bcrypt.hash(password, 10);
}    
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.status(200).json({ 
      message: 'Usuário atualizado com sucesso!', 
      user: updatedUser 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar usuário', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.status(200).json({ message: 'Usuário deletado com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const Order = require('../models/Order');
    
    const orders = await Order.find({ userId: id })
      .populate('products.productId', 'name price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos do usuário', error: err.message });
  }
};
