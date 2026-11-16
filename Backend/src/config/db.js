import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to process.cwd() .env if present

const isNeon = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech'));

let poolInstance;

if (isNeon) {
  // Use Neon serverless Pool over WebSockets (port 443) to avoid firewall/ISP port 5432 blocks
  neonConfig.webSocketConstructor = ws;
  poolInstance = new NeonPool({
    connectionString: process.env.DATABASE_URL,
  });
} else if (process.env.DATABASE_URL) {
  poolInstance = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  poolInstance = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'messledger_db',
  });
}

export const pool = poolInstance;

// Event listeners for connection monitoring
pool.on?.('error', (err) => {
  console.error('[ERROR] Unexpected PostgreSQL error on idle client:', err.message);
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query string
 * @param {Array} params - Array of query parameters
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Execute multiple database operations within an atomic transaction
 * Automatically performs BEGIN, COMMIT, and ROLLBACK on error
 * @param {Function} callback - Function receiving the transactional client: async (client) => { ... }
 */
export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[DB ROLLBACK ERROR]', rbErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Test the database connection
 */
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[INFO] PostgreSQL connected successfully to ${isNeon ? 'Neon Cloud' : 'Database'}: ${res.rows[0].db_name} (Server time: ${res.rows[0].current_time})`);
    return true;
  } catch (error) {
    console.error(`[ERROR] PostgreSQL connection failed: ${error.message}`);
    return false;
  }
};

export default {
  pool,
  query,
  withTransaction,
  testConnection,
};


