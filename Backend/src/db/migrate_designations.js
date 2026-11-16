import { query } from '../config/db.js';

async function migrate() {
  console.log('[MIGRATION] Starting schema update for Senior Warden and Warden designations...');

  try {
    // 1. Add senior_warden columns to hostels
    console.log('[MIGRATION] Adding senior_warden columns to hostels table...');
    await query(`
      ALTER TABLE hostels ADD COLUMN IF NOT EXISTS senior_warden_name VARCHAR(100);
      ALTER TABLE hostels ADD COLUMN IF NOT EXISTS senior_warden_phone VARCHAR(30);
      ALTER TABLE hostels ADD COLUMN IF NOT EXISTS senior_warden_email VARCHAR(150);
    `);

    // 2. Sync existing admin_* to senior_warden_*
    console.log('[MIGRATION] Syncing existing admin contact info into senior_warden columns...');
    await query(`
      UPDATE hostels 
      SET senior_warden_name = COALESCE(senior_warden_name, admin_name),
          senior_warden_phone = COALESCE(senior_warden_phone, admin_phone),
          senior_warden_email = COALESCE(senior_warden_email, admin_email);
    `);

    // 3. Add designation column to users table
    console.log('[MIGRATION] Adding designation column to users table...');
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Resident Student';
    `);

    // 4. Update role check constraint on users
    console.log('[MIGRATION] Updating users role constraint to include SENIOR_WARDEN...');
    await query(`
      DO $$
      DECLARE
          con_name TEXT;
      BEGIN
          SELECT conname INTO con_name
          FROM pg_constraint
          WHERE conrelid = 'users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%';
          
          IF con_name IS NOT NULL THEN
              EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(con_name);
          END IF;
      END $$;

      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('STUDENT', 'SENIOR_WARDEN', 'WARDEN', 'ADMIN'));
    `);

    // 5. Update user roles and designations
    console.log('[MIGRATION] Updating user designations and roles in users table...');
    await query(`
      UPDATE users 
      SET designation = 'Senior Warden', role = 'SENIOR_WARDEN' 
      WHERE role = 'ADMIN';

      UPDATE users 
      SET designation = 'Warden' 
      WHERE role = 'WARDEN' AND (designation IS NULL OR designation = 'Resident Student');

      UPDATE users 
      SET designation = 'Resident Student' 
      WHERE role = 'STUDENT' AND (designation IS NULL OR designation = '');
    `);

    console.log('[MIGRATION SUCCESS] Database schema migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION FAILED]', err);
    process.exit(1);
  }
}

migrate();

