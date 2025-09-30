const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const db = require('./db');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
// A porta é fornecida pelo ambiente de hospedagem (Netlify, Heroku, etc.)
// ou usa 3001 como padrão para desenvolvimento local.
const PORT = process.env.PORT || 3001;

// O segredo do JWT DEVE ser uma variável de ambiente em produção para segurança.
// Configure 'JWT_SECRET' nas variáveis de ambiente do seu site na Netlify.
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto-e-longo-para-jwt';

// ATENÇÃO: Adicione o ID do Cliente do seu projeto Google Cloud Console aqui
const GOOGLE_CLIENT_ID = 'SEU_GOOGLE_CLIENT_ID_AQUI'; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const TIMEOUT_MS = 7000;

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'seu-segredo-super-secreto-e-longo-para-jwt') {
    console.error('ERRO FATAL: JWT_SECRET não foi configurado para produção! A aplicação será encerrada.');
    process.exit(1); // Encerra a aplicação se o segredo padrão for usado em produção.
}

// Helper para garantir que uma operação não exceda um tempo limite
const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`Operation timed out after ${ms} ms`));
        }, ms);
    });
    return Promise.race([promise, timeout]);
};

// Handler de erro genérico para as rotas
const handleRouteError = (err, res, context) => {
    console.error(`Erro em '${context}':`, err.message);
    if (err.message.includes('timed out')) {
        return res.status(504).json({ message: 'O servidor não conseguiu se comunicar com o banco de dados a tempo. Tente novamente.' });
    }
    if (err.code === '23505') { // Violação de unicidade
        return res.status(409).json({ message: `Erro de conflito: ${context} já existe.` });
    }
    res.status(500).json({ message: `Erro interno no servidor em '${context}'.` });
};

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user;
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

        const dbQuery = db.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [username, passwordHash]
        );
        
        const newUser = await withTimeout(dbQuery, TIMEOUT_MS);

        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user: newUser.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        handleRouteError(err, res, 'registro');
    }
});

// Fazer login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const dbQuery = db.query("SELECT * FROM users WHERE username = $1", [username]);
        const result = await withTimeout(dbQuery, TIMEOUT_MS);
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
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (err) {
        handleRouteError(err, res, 'login');
    }
});

// Login com Google
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        let payload;

        if (token.startsWith('simulated-google-id-token')) {
             console.warn('Usando token do Google SIMULADO.');
             const decodedPayload = JSON.parse(atob(token.split('.')[1]));
             payload = { email: decodedPayload.email, name: decodedPayload.name };
        } else {
            return res.status(400).json({ message: "A verificação real do Google está desativada. Configure o GOOGLE_CLIENT_ID." });
        }
        
        const { email } = payload;
        if (!email) {
            return res.status(400).json({ message: 'Token do Google inválido: e-mail não encontrado.' });
        }
        
        const findUserQuery = db.query("SELECT * FROM users WHERE username = $1", [email]);
        let result = await withTimeout(findUserQuery, TIMEOUT_MS);
        let user = result.rows[0];

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);
            
            const createUserQuery = db.query(
                "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
                [email, passwordHash]
            );
            const newUserResult = await withTimeout(createUserQuery, TIMEOUT_MS);
            user = newUserResult.rows[0];
        }

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
        handleRouteError(err, res, 'login com Google');
    }
});


// --- ROTAS PROTEGIDAS ---

// --- AGENDAMENTOS ---

app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const dbQuery = db.query(
            "SELECT * FROM appointments WHERE user_id = $1 ORDER BY datetime ASC",
            [req.user.userId]
        );
        const { rows } = await withTimeout(dbQuery, TIMEOUT_MS);
        res.json(rows);
    } catch (err) {
        handleRouteError(err, res, 'buscar agendamentos');
    }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { clientName, clientPhone, service, datetime, value, observations } = req.body;
        const dbQuery = db.query(
            `INSERT INTO appointments (user_id, client_name, client_phone, service, datetime, value, observations, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled') RETURNING *`,
            [req.user.userId, clientName, clientPhone, service, datetime, value, observations]
        );
        const newAppointment = await withTimeout(dbQuery, TIMEOUT_MS);
        res.status(201).json(newAppointment.rows[0]);
    } catch (err) {
        handleRouteError(err, res, 'criar agendamento');
    }
});

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
        
        const dbQuery = db.query(queryText, queryParams);
        const result = await withTimeout(dbQuery, TIMEOUT_MS);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence a este usuário.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        handleRouteError(err, res, 'atualizar agendamento');
    }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const dbQuery = db.query(
            "DELETE FROM appointments WHERE id = $1 AND user_id = $2",
            [id, req.user.userId]
        );
        const result = await withTimeout(dbQuery, TIMEOUT_MS);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send();
    } catch (err) {
        handleRouteError(err, res, 'deletar agendamento');
    }
});

// --- HORÁRIOS BLOQUEADOS ---

app.get('/api/blocked-slots', authenticateToken, async (req, res) => {
    try {
        const dbQuery = db.query(
            "SELECT id, user_id, date::text, start_time, end_time, is_full_day FROM blocked_slots WHERE user_id = $1 ORDER BY date ASC, start_time ASC",
            [req.user.userId]
        );
        const { rows } = await withTimeout(dbQuery, TIMEOUT_MS);
        res.json(rows);
    } catch (err) {
        handleRouteError(err, res, 'buscar bloqueios');
    }
});

app.post('/api/blocked-slots', authenticateToken, async (req, res) => {
    try {
        const { date, isFullDay, startTime, endTime } = req.body;
        const dbQuery = db.query(
            `INSERT INTO blocked_slots (user_id, date, is_full_day, start_time, end_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, date::text, start_time, end_time, is_full_day`,
            [req.user.userId, date, isFullDay, startTime || null, endTime || null]
        );
        const newSlot = await withTimeout(dbQuery, TIMEOUT_MS);
        res.status(201).json(newSlot.rows[0]);
    } catch (err) {
        handleRouteError(err, res, 'criar bloqueio');
    }
});

app.delete('/api/blocked-slots/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const dbQuery = db.query(
            "DELETE FROM blocked_slots WHERE id = $1 AND user_id = $2",
            [id, req.user.userId]
        );
        const result = await withTimeout(dbQuery, TIMEOUT_MS);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Bloqueio não encontrado ou não pertence a este usuário.' });
        }
        res.status(204).send();
    } catch (err) {
        handleRouteError(err, res, 'deletar bloqueio');
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🎉 Servidor backend rodando na porta ${PORT}`);
});