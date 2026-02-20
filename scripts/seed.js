const { Pool } = require('pg');
const crypto = require('crypto');

// Replicar función de hash de auth.ts
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 1000;
  // Usar 32 bytes (256 bits) como longitud de la clave derivada
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

// Cargar variables de entorno manualmente si no se ejecuta con --env-file
if (!process.env.DATABASE_URL) {
  try {
    require('dotenv').config();
  } catch (e) {
    // Si dotenv no está instalado, esperamos que DATABASE_URL esté en el entorno
    console.warn('dotenv no encontrado, confiando en variables de entorno del sistema.');
  }
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL no está definida.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Creando tabla users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        manager_id TEXT,
        password_hash TEXT NOT NULL
      );
    `);

    console.log('Creando tabla surveys...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        score INTEGER NOT NULL,
        answers JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Limpiando usuarios existentes...');
    await client.query('DELETE FROM surveys');
    await client.query('DELETE FROM users');

    const password = 'demo123';
    const passwordHash = hashPassword(password);

    const users = [
      { id: 'u1', email: 'user@demo.com', name: 'Usuario Demo', role: 'user', manager_id: 'm1' },
      { id: 'm1', email: 'manager@demo.com', name: 'Manager Demo', role: 'manager', manager_id: 'm2' },
      { id: 'm2', email: 'manager2@demo.com', name: 'Manager Superior', role: 'manager', manager_id: null },
      { id: 'd1', email: 'doctor@demo.com', name: 'Doctora Demo', role: 'doctor', manager_id: null },
      { id: 'a1', email: 'admin@demo.com', name: 'Admin Demo', role: 'admin', manager_id: null },
    ];

    console.log('Insertando usuarios...');
    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, name, role, manager_id, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.email, user.name, user.role, user.manager_id, passwordHash]
      );
    }

    console.log('Datos de prueba insertados correctamente.');
    console.log('Contraseña para todos los usuarios:', password);
  } catch (err) {
    console.error('Error al poblar la base de datos:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
