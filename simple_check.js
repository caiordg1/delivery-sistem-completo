require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB');
    
    // Listar todas as collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections no banco:', collections.map(c => c.name));
    
    // Verificar se existe collection users
    const usersCollection = mongoose.connection.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Total de usuários:', userCount);
    
    // Buscar usuário específico
    const user = await usersCollection.findOne({ email: 'admin@admin.com' });
    console.log('🔍 Usuário admin encontrado:', user ? 'SIM' : 'NÃO');
    
    if (user) {
      console.log('📧 Email:', user.email);
      console.log('🔐 Senha hash existe:', user.password ? 'SIM' : 'NÃO');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
