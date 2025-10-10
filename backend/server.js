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


// --- API de Clientes ---

// [GET] /api/clientes - Retorna todos os clientes
app.get('/api/clientes', (req, res) => {
  res.status(200).json(db.clients);
});

// [POST] /api/clientes - Cria um novo cliente
app.post('/api/clientes', (req, res) => {
  const { name, phone, email, observations } = req.body;

  // Validação
  if (!name || !phone) {
    return res.status(400).json({ message: "Nome e telefone são obrigatórios." });
  }

  // Checa se cliente já existe pelo telefone
  const sanitizedPhone = phone.replace(/\D/g, '');
  const clientExists = db.clients.some(client => client.phone.replace(/\D/g, '') === sanitizedPhone);
  if (clientExists) {
    return res.status(409).json({ message: "Cliente com este telefone já existe." });
  }
  
  const newClient = {
    id: Date.now(),
    name,
    phone,
    email: email || '',
    observations: observations || ''
  };

  db.clients.push(newClient);
  console.log('Nova cliente adicionada:', newClient.name);
  res.status(201).json(newClient);
});


// --- API de Profissionais ---

// [GET] /api/profissionais - Retorna todos os profissionais
app.get('/api/profissionais', (req, res) => {
  // O ideal é não retornar a senha
  const professionalsWithoutPasswords = {};
  for (const username in db.professionals) {
    const { password, ...professionalData } = db.professionals[username];
    professionalsWithoutPasswords[username] = { ...professionalData, username };
  }
  res.status(200).json(professionalsWithoutPasswords);
});

// [POST] /api/profissionais - Cria um novo profissional
app.post('/api/profissionais', (req, res) => {
  const { username, name, password, role } = req.body;

  // Validação
  if (!username || !name || !password || !role) {
    return res.status(400).json({ message: "Usuário, nome, senha e função são obrigatórios." });
  }
  
  const userKey = username.toLowerCase();
  if (db.professionals[userKey]) {
    return res.status(409).json({ message: "Nome de usuário já existe." });
  }

  const newProfessional = {
    name,
    password, // Em um app real, isso seria hasheado
    role,
    assignedServices: [], // Começa sem serviços atribuídos
  };

  db.professionals[userKey] = newProfessional;
  console.log('Nova profissional adicionada:', newProfessional.name);

  const { password: _, ...responseData } = newProfessional;
  res.status(201).json({ ...responseData, username: userKey });
});


// Rota básica para confirmar que o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Spaço Delas está no ar!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});