const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/delivery-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

async function showUsers() {
  const users = await User.find();
  console.log('📋 Usuários encontrados:\n');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} - ${user.email}`);
  });
  mongoose.disconnect();
}

showUsers();
