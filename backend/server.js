const express = require('express');
const cors = require('cors');
// Altera a importação para obter o objeto 'db' e a função 'saveDatabase'
const { db, saveDatabase } = require('./db');

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
  saveDatabase(); // Salva as alterações no arquivo
  
  console.log('Novo agendamento adicionado:', newAppointment.clientName, 'em', newAppointment.datetime.toLocaleDateString());
  
  res.status(201).json(newAppointment); // Retorna o agendamento criado com status 201 (Created)
});

// [PUT] /api/agendamentos/:id - Atualiza um agendamento
app.put('/api/agendamentos/:id', (req, res) => {
  const appointmentId = parseInt(req.params.id, 10);
  const updatedData = req.body;
  
  const appointmentIndex = db.appointments.findIndex(a => a.id === appointmentId);

  if (appointmentIndex === -1) {
    return res.status(404).json({ message: "Agendamento não encontrado." });
  }

  // Preserve the original ID, merge new data
  const updatedAppointment = { 
    ...db.appointments[appointmentIndex], 
    ...updatedData,
    id: appointmentId, // Ensure ID is not changed
    datetime: new Date(updatedData.datetime), // Ensure dates are objects
    endTime: new Date(updatedData.endTime),
  };
  
  db.appointments[appointmentIndex] = updatedAppointment;
  saveDatabase(); // Salva as alterações no arquivo
  
  console.log('Agendamento atualizado:', updatedAppointment.clientName);
  res.status(200).json(updatedAppointment);
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
  saveDatabase(); // Salva as alterações no arquivo
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
    saveDatabase(); // Salva as alterações no arquivo
    console.log('Cliente atualizado:', updatedClient.name);
    res.status(200).json(updatedClient);
});


// --- API de Profissionais ---

// [GET] /api/profissionais - Retorna todos os profissionais
app.get('/api/profissionais', (req, res) => {
  res.status(200).json(db.professionals);
});

// [POST] /api/profissionais - Cria um novo profissional
app.post('/api/profissionais', (req, res) => {
  const { username, name, password, role, ...rest } = req.body;

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
    ...rest,
  };

  db.professionals[userKey] = newProfessional;
  saveDatabase(); // Salva as alterações no arquivo
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

    // Apenas atualiza a senha se uma nova for enviada
    const newPassword = password ? password : db.professionals[username].password;

    const updatedProfessional = {
        ...db.professionals[username],
        ...updatedData,
        password: newPassword
    };

    db.professionals[username] = updatedProfessional;
    saveDatabase(); // Salva as alterações no arquivo
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
    saveDatabase(); // Salva as alterações no arquivo
    console.log('Profissional removido:', username);
    res.status(204).send(); // No Content
});


// Rota básica para confirmar que o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Spaço Delas está no ar!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
