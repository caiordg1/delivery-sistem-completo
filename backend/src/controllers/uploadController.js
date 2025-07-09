const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/products');
        
        // Garantir que a pasta existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Gerar nome único: timestamp + nome original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const fileName = `product-${uniqueSuffix}${extension}`;
        cb(null, fileName);
    }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Use apenas: JPEG, PNG, GIF ou WebP'), false);
    }
};

// Configuração do multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: fileFilter
});

// Upload de imagem de produto
exports.uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: 'Nenhuma imagem foi enviada.' 
            });
        }

        // URL da imagem para retornar
        const imageUrl = `/uploads/products/${req.file.filename}`;

        res.status(200).json({
            message: 'Imagem enviada com sucesso!',
            imageUrl: imageUrl,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erro ao fazer upload da imagem.',
            error: error.message
        });
    }
};

// Deletar imagem de produto
exports.deleteProductImage = async (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(__dirname, '../../uploads/products', fileName);

        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: 'Imagem não encontrada.'
            });
        }

        // Deletar o arquivo
        fs.unlinkSync(filePath);

        res.status(200).json({
            message: 'Imagem deletada com sucesso!',
            fileName: fileName
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erro ao deletar imagem.',
            error: error.message
        });
    }
};

// Listar todas as imagens de produtos
exports.listProductImages = async (req, res) => {
    try {
        const uploadsPath = path.join(__dirname, '../../uploads/products');
        
        if (!fs.existsSync(uploadsPath)) {
            return res.status(200).json({
                message: 'Pasta de uploads não encontrada.',
                images: []
            });
        }

        const files = fs.readdirSync(uploadsPath);
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                fileName: file,
                url: `/uploads/products/${file}`,
                size: fs.statSync(path.join(uploadsPath, file)).size
            }));

        res.status(200).json({
            message: 'Lista de imagens retornada com sucesso.',
            count: images.length,
            images: images
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erro ao listar imagens.',
            error: error.message
        });
    }
};

// Middleware do multer para usar nas rotas
exports.uploadMiddleware = upload.single('image');
