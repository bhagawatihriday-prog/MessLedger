import { query, pool } from '../config/db.js';

async function migrate() {
  console.log('--- Starting Database Normalization Migration ---');
  try {
    // 1. Add senior_warden_id and warden_id to hostels
    console.log('1. Adding senior_warden_id and warden_id foreign keys to hostels...');
    await query(`
      ALTER TABLE hostels 
      ADD COLUMN IF NOT EXISTS senior_warden_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS warden_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 2. Link existing active senior wardens and wardens from users to hostels
    console.log('2. Linking existing users to hostels table...');
    await query(`
      UPDATE hostels h
      SET senior_warden_id = u.id
      FROM users u
      WHERE (LOWER(u.hostel) = LOWER(h.id) OR UPPER(u.hostel) = UPPER(h.name))
        AND u.role IN ('ADMIN', 'SENIOR_WARDEN')
        AND (h.senior_warden_id IS NULL);
    `);

    await query(`
      UPDATE hostels h
      SET warden_id = u.id
      FROM users u
      WHERE (LOWER(u.hostel) = LOWER(h.id) OR UPPER(u.hostel) = UPPER(h.name))
        AND u.role = 'WARDEN'
        AND (h.warden_id IS NULL);
    `);

    // 3. Drop redundant text columns from hostels
    console.log('3. Dropping redundant contact text columns from hostels...');
    await query(`
      ALTER TABLE hostels 
      DROP COLUMN IF EXISTS senior_warden_name,
      DROP COLUMN IF EXISTS senior_warden_phone,
      DROP COLUMN IF EXISTS senior_warden_email,
      DROP COLUMN IF EXISTS warden_name,
      DROP COLUMN IF EXISTS warden_phone,
      DROP COLUMN IF EXISTS warden_email;
    `);

    // 4. Drop trigger and function trg_cleanup_hostel_admin_on_user_delete
    console.log('4. Dropping obsolete trigger trg_cleanup_hostel_admin_on_user_delete...');
    await query(`
      DROP TRIGGER IF EXISTS trg_cleanup_hostel_admin_on_user_delete ON users;
      DROP FUNCTION IF EXISTS trg_cleanup_hostel_admin_on_user_delete();
    `);

    // 5. Drop redundant columns is_registered and registered_at from boarders
    console.log('5. Dropping redundant status columns from boarders...');
    await query(`
      ALTER TABLE boarders 
      DROP COLUMN IF EXISTS is_registered,
      DROP COLUMN IF EXISTS registered_at;
    `);

    // 6. Synchronize bills due_amount and total_payable
    console.log('6. Synchronizing bills financial calculations...');
    await query(`
      UPDATE bills
      SET due_amount = GREATEST(0, (COALESCE(base_bill, 0) + COALESCE(late_fine, 0) - COALESCE(paid_amount, 0))),
          total_payable = GREATEST(0, (COALESCE(base_bill, 0) + COALESCE(late_fine, 0) + COALESCE(previous_due, 0) - COALESCE(paid_amount, 0)));
    `);

    console.log('--- Migration completed successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (pool?.end) await pool.end();
  }
}

migrate();

