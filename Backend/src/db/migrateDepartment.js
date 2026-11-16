import { pool, query } from '../config/db.js';

async function migrate() {
  console.log('[MIGRATION] Adding department and phone columns...');
  try {
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE boarders ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE boarders ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
    `);
    console.log('[MIGRATION] Successfully updated users and boarders tables!');
  } catch (error) {
    console.error('[MIGRATION ERROR]', error);
  } finally {
    await pool.end();
  }
}

migrate();
