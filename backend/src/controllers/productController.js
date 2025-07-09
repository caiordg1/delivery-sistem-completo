const Product = require('../models/Product');

// Criar novo produto no cardápio
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, available } = req.body;

        const newProduct = new Product({
            name,
            description,
            price,
            image,
            category,
            available: available !== undefined ? available : true
        });

        await newProduct.save();
        res.status(201).json({ message: 'Produto criado com sucesso!', product: newProduct });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar produto.', error: err.message });
    }
};

// Listar todos os produtos do cardápio
exports.getMenu = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar o cardápio.', error: err.message });
    }
};

// Obter produto específico por ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar produto.', error: err.message });
    }
};

// Atualizar produto
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ 
            message: 'Produto atualizado com sucesso!', 
            product: updatedProduct 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar produto.', error: err.message });
    }
};

// Deletar produto
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ 
            message: 'Produto deletado com sucesso!',
            product: deletedProduct 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar produto.', error: err.message });
    }
};

// Alternar status do produto (ativo/inativo)
exports.toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        product.available = !product.available;
        await product.save();

        res.status(200).json({ 
            message: `Produto ${product.available ? 'ativado' : 'desativado'} com sucesso!`,
            product 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao alterar status do produto.', error: err.message });
    }
};
