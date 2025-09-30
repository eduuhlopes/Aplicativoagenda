const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const db = require('./db');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// ATENÇÃO: Mude este segredo para algo único e seguro!
// O ideal é usar uma variável de ambiente (process.env.JWT_SECRET)
const JWT_SECRET = 'seu-segredo-super-secreto-e-longo-para-jwt';

// ATENÇÃO: Adicione o ID do Cliente do seu projeto Google Cloud Console aqui
// O ideal é usar uma variável de ambiente (process.env.GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = 'SEU_GOOGLE_CLIENT_ID_AQUI'; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


// Middlewares
app.use(cors()); // Permite requisições do seu frontend (que roda em outra porta)
app.use(express.json()); // Permite que o servidor entenda JSON

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user; // Adiciona os dados do usuário (ex: { userId: 1, username: 'ana' }) ao request
        next();
    });
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Registrar novo usuário
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [username, passwordHash]
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: newUser.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') { // Erro de violação de chave única (username já existe)
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        console.error('Erro no registro:', err);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar registrar.' });
    }
});

// Fazer login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar fazer login.' });
    }
});

// Login com Google
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        let payload;

        // Bloco de verificação do token (simulado para desenvolvimento)
        if (token.startsWith('simulated-google-id-token')) {
             // Lógica de simulação para desenvolvimento sem precisar do frontend real do Google
             console.warn('Usando token do Google SIMULADO.');
             const decodedPayload = JSON.parse(atob(token.split('.')[1]));
             payload = { email: decodedPayload.email, name: decodedPayload.name };
        } else {
            // Lógica de produção: verificar o token com os servidores do Google
            // Descomente esta parte quando tiver um GOOGLE_CLIENT_ID real
            /*
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
            */
            return res.status(400).json({ message: "A verificação real do Google está desativada. Configure o GOOGLE_CLIENT_ID." });
        }
        
        const { email, name } = payload;
        if (!email) {
            return res.status(400).json({ message: 'Token do Google inválido: e-mail não encontrado.' });
        }

        // Verifica se o usuário já existe pelo e-mail (que será o username)
        let result = await db.query("SELECT * FROM users WHERE username = $1", [email]);
        let user = result.rows[0];

        if (!user) {
            // Se o usuário não existe, cria um novo
            // O campo 'password_hash' não pode ser nulo, então geramos um hash aleatório e seguro
            // que nunca será usado para login.
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);
            
            const newUserResult = await db.query(
                "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
                [email, passwordHash]
            );
            user = newUserResult.rows[0];
        }

        // Gera o token da nossa aplicação para o usuário logado
        const appToken = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login com Google bem-sucedido!',
            token: appToken,
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.error('Erro na autenticação com Google:', err);
        res.status(500).json({ message: 'Erro interno no servidor durante a autenticação com Google.' });
    }
});


// --- ROTAS PROTEGIDAS (requerem token) ---

// --- AGENDAMENTOS ---

// Obter todos os agendamentos do usuário logado
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            "SELECT * FROM appointments WHERE user_id = $1 ORDER BY datetime ASC",
            [req.user.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
});

// Criar um novo agendamento
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { clientName, clientPhone, service, datetime, value, observations } = req.body;
        const newAppointment = await db.query(
            `INSERT INTO appointments (user_id, client_name, client_phone, service, datetime, value, observations, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled') RETURNING *`,
            [req.user.userId, clientName, clientPhone, service, datetime, value, observations]
        );
        res.status(201).json(newAppointment.rows[0]);
    } catch (err) {
        console.error('Erro ao criar agendamento:', err);
        res.status(500).json({ message: 'Erro ao criar agendamento.' });
    }
});

// Atualizar um agendamento
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { clientName, clientPhone, service, datetime, value, observations, status, reminderSent } = req.body;
        
        const fields = { client_name: clientName, client_phone: clientPhone, service, datetime, value, observations, status, reminder_sent: reminderSent };
        const updates = Object.entries(fields)
            .filter(([_, val]) => val !== undefined)
            .map(([key, val], i) => `${key} = $${i + 3}`)
            .join(', ');
        
        const values = Object.values(fields).filter(val => val !== undefined);

        if (updates.length === 0) {
            return res.status(400).json({ message: "Nenhum campo para atualizar foi fornecido."});
        }

        const queryText = `UPDATE appointments SET ${updates} WHERE id = $1 AND user_id = $2 RETURNING *`;
        const queryParams = [id, req.user.userId, ...values];
        
        const result = await db.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence a este usuário.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar agendamento:', err);
        res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
    }
});


// Deletar (cancelar) um agendamento
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "DELETE FROM appointments WHERE id = $1 AND user_id = $2",
            [id, req.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send(); // No Content
    } catch (err) {
        console.error('Erro ao deletar agendamento:', err);
        res.status(500).json({ message: 'Erro ao deletar agendamento.' });
    }
});

// --- HORÁRIOS BLOQUEADOS ---

// Obter todos os horários bloqueados
app.get('/api/blocked-slots', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            "SELECT id, user_id, date::text, start_time, end_time, is_full_day FROM blocked_slots WHERE user_id = $1 ORDER BY date ASC, start_time ASC",
            [req.user.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar horários bloqueados:', err);
        res.status(500).json({ message: 'Erro ao buscar horários bloqueados.' });
    }
});

// Criar um novo bloqueio
app.post('/api/blocked-slots', authenticateToken, async (req, res) => {
    try {
        const { date, isFullDay, startTime, endTime } = req.body;
        const newSlot = await db.query(
            `INSERT INTO blocked_slots (user_id, date, is_full_day, start_time, end_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, date::text, start_time, end_time, is_full_day`,
            [req.user.userId, date, isFullDay, startTime || null, endTime || null]
        );
        res.status(201).json(newSlot.rows[0]);
    } catch (err) {
        console.error('Erro ao criar bloqueio:', err);
        res.status(500).json({ message: 'Erro ao criar bloqueio.' });
    }
});

// Deletar um bloqueio
app.delete('/api/blocked-slots/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "DELETE FROM blocked_slots WHERE id = $1 AND user_id = $2",
            [id, req.user.userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Bloqueio não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar bloqueio:', err);
        res.status(500).json({ message: 'Erro ao deletar bloqueio.' });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🎉 Servidor backend rodando na porta ${PORT}`);
    console.log(`🔗 Frontend deve fazer requisições para http://localhost:${PORT}/api/...`);
});