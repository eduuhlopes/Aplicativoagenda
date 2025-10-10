const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importa nosso banco de dados em memória

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Essencial para conseguir ler o req.body em POST/PUT

// --- API de Agendamentos ---

// [GET] /api/agendamentos - Retorna todos os agendamentos
app.get('/api/agendamentos', (req, res) => {
  // Ordena por data antes de enviar
  const sortedAppointments = [...db.appointments].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  res.status(200).json(sortedAppointments);
});

// [POST] /api/agendamentos - Cria um novo agendamento
app.post('/api/agendamentos', (req, res) => {
  const newAppointmentData = req.body;
  
  // Validação básica
  if (!newAppointmentData.clientName || !newAppointmentData.datetime) {
    return res.status(400).json({ message: "Dados do agendamento incompletos." });
  }

  const newAppointment = {
    ...newAppointmentData,
    id: Date.now(), // ID único
    status: newAppointmentData.status || 'scheduled',
    // Garante que as datas sejam objetos Date
    datetime: new Date(newAppointmentData.datetime),
    endTime: new Date(newAppointmentData.endTime),
  };

  db.appointments.push(newAppointment);
  
  console.log('Novo agendamento adicionado:', newAppointment.clientName, 'em', newAppointment.datetime.toLocaleDateString());
  
  res.status(201).json(newAppointment); // Retorna o agendamento criado com status 201 (Created)
});

// TODO: Adicionar rotas para /api/clientes, /api/profissionais, etc.


// Rota básica para confirmar que o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Spaço Delas está no ar!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
