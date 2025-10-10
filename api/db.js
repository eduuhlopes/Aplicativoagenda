const fs = require('fs');
const path = require('path');

// ATTENTION: Vercel has a read-only filesystem, except for the /tmp directory.
// This script is modified to work in that environment.
// It will copy the initial database to /tmp on the first run and use that file for subsequent operations.
// This means that DATA WILL NOT BE PERSISTENT across deployments or if the serverless instance is recycled.
// For persistent data, an external database service (like Vercel Postgres, Supabase, etc.) is recommended.

const sourceDbPath = path.join(__dirname, 'db.json');
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? path.join('/tmp', 'db.json') : sourceDbPath;

// On Vercel, copy the initial database from the read-only directory to the writable /tmp directory if it doesn't exist there yet.
if (isVercel && !fs.existsSync(dbPath)) {
  try {
    fs.copyFileSync(sourceDbPath, dbPath);
    console.log('Database copied to /tmp for ephemeral writes.');
  } catch (error) {
    console.error('Failed to copy database to /tmp:', error);
  }
}

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
  // Always try to read from dbPath (which will be /tmp on Vercel)
  if (fs.existsSync(dbPath)) {
    const fileContent = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(fileContent);
    console.log('Banco de dados carregado de:', dbPath);
  } else {
    // This case should ideally not happen on Vercel after the copy, but it's a safe fallback.
    db = defaultData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log('Arquivo db.json não encontrado. Criado com dados padrão em:', dbPath);
  }
} catch (error) {
  console.error('Erro ao carregar ou criar o banco de dados. Usando dados padrão.', error);
  db = defaultData; // Fallback
}

// Function to save the current state of the database to the file
const saveDatabase = () => {
  try {
    // This will write to /tmp on Vercel
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar o banco de dados:', error);
  }
};

module.exports = {
  db,
  saveDatabase,
};
