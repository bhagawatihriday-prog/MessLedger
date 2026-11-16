import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { query } = await import('../config/db.js');

async function migrate() {
  console.log('🔄 Applying Unique Email Index on boarders table...');
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_boarders_email_unique 
      ON boarders (LOWER(email));
    `);
    console.log('✅ Successfully created idx_boarders_email_unique on boarders(LOWER(email))');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

migrate();

