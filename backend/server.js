const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rota básica para confirmar que o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Spaço Delas está no ar!');
});

// TODO: Adicionar rotas da API para agendamentos, clientes, etc.

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
