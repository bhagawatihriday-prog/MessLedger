import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('[INFO] Checking database connection...');
  const isConnected = await testConnection();

  if (!isConnected) {
    console.error('[ERROR] Cannot run migrations because the database connection failed.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[INFO] Executing schema.sql to initialize tables...');

  try {
    await pool.query(sql);
    console.log('[INFO] All tables and initial seed data created successfully.');
  } catch (error) {
    console.error('[ERROR] Error executing schema.sql:', error.message);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
