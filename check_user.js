const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/src/models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB');
    
    const user = await User.findOne({ email: 'admin@admin.com' });
    
    if (user) {
      console.log('✅ Usuário encontrado:');
      console.log('Email:', user.email);
      console.log('Senha hash:', user.password);
      console.log('Data criação:', user.createdAt);
    } else {
      console.log('❌ Usuário NÃO encontrado no banco!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
