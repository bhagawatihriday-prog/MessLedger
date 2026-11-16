import dotenv from 'dotenv';
dotenv.config();
import { query } from '../config/db.js';

export async function migrateRebates() {
  console.log('Migrating rebates table...');
  await query(`
    CREATE TABLE IF NOT EXISTS rebates (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      days INTEGER DEFAULT 0,
      daily_rate NUMERIC(10, 2) DEFAULT 115,
      calc_mode VARCHAR(20) DEFAULT 'DAYS',
      app_ref VARCHAR(100),
      reason_category VARCHAR(50),
      from_date DATE,
      to_date DATE,
      remarks TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Rebates table successfully ensured in Neon DB!');
}

if (process.argv[1]?.includes('migrateRebates')) {
  migrateRebates().then(() => process.exit(0)).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
