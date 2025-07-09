const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://127.0.0.1:27017/delivery-system');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  const existing = await User.findOne({ email: 'admin@admin.com' });
  if (existing) {
    console.log('⚠️ Usuário admin@admin.com já existe.');
    return mongoose.disconnect();
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = new User({
    name: 'Admin',
    email: 'admin@admin.com',
    password: hashedPassword,
    role: 'admin',
  });

  await user.save();
  console.log('✅ Usuário admin criado com sucesso!');
  mongoose.disconnect();
}

createAdmin();
