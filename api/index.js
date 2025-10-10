const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, saveDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---

// [GET] /api/agendamentos - Retorna todos os agendamentos
app.get('/api/agendamentos', (req, res) => {
  const sortedAppointments = [...db.appointments].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  res.status(200).json(sortedAppointments);
});

// [POST] /api/agendamentos - Cria um novo agendamento
app.post('/api/agendamentos', (req, res) => {
  const newAppointmentData = req.body;
  if (!newAppointmentData.clientName || !newAppointmentData.datetime) {
    return res.status(400).json({ message: "Dados do agendamento incompletos." });
  }
  const newAppointment = {
    ...newAppointmentData,
    id: Date.now(),
    status: newAppointmentData.status || 'scheduled',
    datetime: new Date(newAppointmentData.datetime),
    endTime: new Date(newAppointmentData.endTime),
  };
  db.appointments.push(newAppointment);
  saveDatabase();
  console.log('Novo agendamento adicionado:', newAppointment.clientName, 'em', newAppointment.datetime.toLocaleDateString());
  res.status(201).json(newAppointment);
});

// [PUT] /api/agendamentos/:id - Atualiza um agendamento
app.put('/api/agendamentos/:id', (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  const updatedData = req.body;
  const appointmentIndex = db.appointments.findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return res.status(404).json({ message: "Agendamento não encontrado." });
  }
  const updatedAppointment = { 
    ...db.appointments[appointmentIndex], 
    ...updatedData,
    id: appointmentId,
    datetime: new Date(updatedData.datetime),
    endTime: new Date(updatedData.endTime),
  };
  db.appointments[appointmentIndex] = updatedAppointment;
  saveDatabase();
  console.log('Agendamento atualizado:', updatedAppointment.clientName);
  res.status(200).json(updatedAppointment);
});

// [GET] /api/clientes - Retorna todos os clientes
app.get('/api/clientes', (req, res) => {
  res.status(200).json(db.clients);
});

// [POST] /api/clientes - Cria um novo cliente
app.post('/api/clientes', (req, res) => {
  const { name, phone, email, observations } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: "Nome e telefone são obrigatórios." });
  }
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
  saveDatabase();
  console.log('Nova cliente adicionada:', newClient.name);
  res.status(201).json(newClient);
});

// [PUT] /api/clientes/:id - Atualiza um cliente
app.put('/api/clientes/:id', (req, res) => {
    const clientId = parseInt(req.params.id, 10);
    const updatedData = req.body;
    const clientIndex = db.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) {
        return res.status(404).json({ message: "Cliente não encontrado." });
    }
    const updatedClient = {
        ...db.clients[clientIndex],
        ...updatedData,
        id: clientId,
    };
    db.clients[clientIndex] = updatedClient;
    saveDatabase();
    console.log('Cliente atualizado:', updatedClient.name);
    res.status(200).json(updatedClient);
});

// [GET] /api/profissionais - Retorna todos os profissionais
app.get('/api/profissionais', (req, res) => {
  res.status(200).json(db.professionals);
});

// [POST] /api/profissionais - Cria um novo profissional
app.post('/api/profissionais', (req, res) => {
  const { username, name, password, role, ...rest } = req.body;
  if (!username || !name || !password || !role) {
    return res.status(400).json({ message: "Usuário, nome, senha e função são obrigatórios." });
  }
  const userKey = username.toLowerCase();
  if (db.professionals[userKey]) {
    return res.status(409).json({ message: "Nome de usuário já existe." });
  }
  const newProfessional = { name, password, role, assignedServices: [], ...rest };
  db.professionals[userKey] = newProfessional;
  saveDatabase();
  console.log('Nova profissional adicionada:', newProfessional.name);
  res.status(201).json({ ...newProfessional, username: userKey });
});

// [PUT] /api/profissionais/:username - Atualiza um profissional
app.put('/api/profissionais/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    const { password, ...updatedData } = req.body;
    if (!db.professionals[username]) {
        return res.status(404).json({ message: "Profissional não encontrado." });
    }
    const newPassword = password ? password : db.professionals[username].password;
    const updatedProfessional = { ...db.professionals[username], ...updatedData, password: newPassword };
    db.professionals[username] = updatedProfessional;
    saveDatabase();
    console.log('Profissional atualizado:', updatedProfessional.name);
    res.status(200).json({ ...updatedProfessional, username });
});

// [DELETE] /api/profissionais/:username - Deleta um profissional
app.delete('/api/profissionais/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    if (username === 'admin') {
        return res.status(403).json({ message: "Não é permitido remover o administrador." });
    }
    if (!db.professionals[username]) {
        return res.status(404).json({ message: "Profissional não encontrado." });
    }
    delete db.professionals[username];
    saveDatabase();
    console.log('Profissional removido:', username);
    res.status(204).send();
});

// --- SERVIR ARQUIVOS DO FRONTEND ---

// Servir arquivos estáticos (como .tsx, .css, .png) da pasta raiz do projeto.
// Esta linha deve vir ANTES da rota catch-all.
app.use(express.static(path.join(__dirname, '..')));

// Rota catch-all: Para qualquer requisição GET que NÃO seja para a API,
// serve o index.html. Isso permite que o roteamento do React funcione.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Export the app instance for Vercel's serverless environment
module.exports = app;
