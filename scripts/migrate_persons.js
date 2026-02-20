const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL no está configurada");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Creando tabla persons...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        designation TEXT,
        specialization TEXT,
        work_area TEXT,
        weekly_hours INTEGER,
        address TEXT,
        contact TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Tabla persons creada exitosamente.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
