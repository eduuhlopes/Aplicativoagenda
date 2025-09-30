const { Pool } = require('pg');

// A configuração do banco de dados agora é lida a partir de variáveis de ambiente.
// Isso é essencial para a implantação em serviços como Netlify, Heroku, etc.
//
// 1. CRIE UM BANCO DE DADOS POSTGRESQL EM NUVEM:
//    - Use um serviço como Neon (neon.tech), Supabase, ou ElephantSQL.
//    - Após criar, você receberá uma "Connection String" ou "URL de Conexão".
//
// 2. CONFIGURE A VARIÁVEL DE AMBIENTE:
//    - No painel do seu serviço de hospedagem (Netlify), vá para as configurações
//      do seu site > Build & deploy > Environment variables.
//    - Crie uma nova variável de ambiente chamada DATABASE_URL.
//    - Cole a URL de conexão do seu banco de dados como o valor.
//      Exemplo: postgres://[user]:[password]@[host]:[port]/[database]
//
// O 'localhost' NÃO FUNCIONA em produção pois o servidor e o banco não estão na mesma máquina.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // A maioria dos bancos de dados em nuvem exige conexão SSL.
    rejectUnauthorized: false
  },
  statement_timeout: 5000,
  connectionTimeoutMillis: 5000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};