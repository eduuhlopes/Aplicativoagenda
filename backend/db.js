// Este arquivo atua como nosso banco de dados em memória temporário.
// Os dados serão perdidos se o servidor for reiniciado.
// Em um próximo passo, substituiremos isso por um banco de dados persistente.

const db = {
  appointments: [],
  clients: [],
  professionals: {},
  // Adicione outras "tabelas" de dados conforme necessário
};

module.exports = db;
