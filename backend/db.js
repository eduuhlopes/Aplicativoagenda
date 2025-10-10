const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

// Estrutura inicial do banco de dados se o arquivo não existir.
// Mantém o usuário 'admin' padrão para garantir o primeiro acesso.
const defaultData = {
  appointments: [],
  clients: [],
  professionals: {
      admin: {
          name: 'Administradora',
          password: 'admin',
          role: 'admin',
          assignedServices: []
      }
  },
};

let db;

try {
  if (fs.existsSync(dbPath)) {
    const fileContent = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(fileContent);
    console.log('Banco de dados carregado do arquivo db.json.');
  } else {
    // Se o arquivo não existe, cria com os dados padrão
    db = defaultData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log('Arquivo db.json não encontrado. Criado com dados padrão.');
  }
} catch (error) {
  console.error('Erro ao carregar ou criar o banco de dados. Usando dados padrão.', error);
  db = defaultData; // Fallback para dados padrão em caso de erro
}

// Função para salvar o estado atual do banco de dados no arquivo
const saveDatabase = () => {
  try {
    // Usamos 'writeFileSync' para simplicidade. Em apps maiores, 'writeFile' (assíncrono) seria melhor.
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar o banco de dados:', error);
  }
};

module.exports = {
  db,
  saveDatabase,
};
