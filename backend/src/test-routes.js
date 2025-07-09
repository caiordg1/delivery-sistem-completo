const express = require('express');
const app = express();

app.use(express.json());

// Teste simples
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Rota funcionando!', body: req.body });
});

app.listen(4000, () => {
  console.log('Teste rodando na porta 4000');
});
