const { Pool } = require('pg');

// ATENÇÃO: Configure suas credenciais do PostgreSQL aqui.
// É altamente recomendado usar variáveis de ambiente para isso em um ambiente de produção.
const pool = new Pool({
  user: 'postgres', // Ex: 'postgres'
  host: 'localhost',
  database: 'agenda_spaco_delas', // Crie um banco com este nome ou altere aqui
  password: '150916Pietro@',
  port: 5432,
  statement_timeout: 5000, // Timeout de 5s para queries. Evita que a aplicação trave.
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};