import { query } from '../config/db.js';

async function setupTrigger() {
  console.log('[TRIGGER SETUP] Configuring automatic hostel admin cleanup on user deletion...');

  try {
    // 1. Clean up any existing orphaned admin/warden emails in hostels table
    console.log('[TRIGGER SETUP] 1. Cleaning up existing orphaned admin/warden emails in hostels...');
    const cleanupRes = await query(`
      UPDATE hostels
      SET senior_warden_name = NULL, senior_warden_phone = NULL, senior_warden_email = NULL,
          admin_name = NULL, admin_phone = NULL, admin_email = NULL
      WHERE (senior_warden_email IS NOT NULL AND LOWER(senior_warden_email) NOT IN (SELECT LOWER(email) FROM users WHERE role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN')))
         OR (admin_email IS NOT NULL AND LOWER(admin_email) NOT IN (SELECT LOWER(email) FROM users WHERE role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN')));

      UPDATE hostels
      SET warden_name = NULL, warden_phone = NULL, warden_email = NULL
      WHERE warden_email IS NOT NULL 
        AND LOWER(warden_email) NOT IN (SELECT LOWER(email) FROM users WHERE role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN'));
    `);
    console.log('[TRIGGER SETUP] Cleaned existing orphaned emails.');

    // 2. Create or replace trigger function
    console.log('[TRIGGER SETUP] 2. Creating PostgreSQL trigger function...');
    await query(`
      CREATE OR REPLACE FUNCTION trg_cleanup_hostel_admin_on_user_delete()
      RETURNS TRIGGER AS $$
      BEGIN
          IF OLD.email IS NOT NULL THEN
              UPDATE hostels
              SET 
                  senior_warden_name = CASE 
                      WHEN LOWER(COALESCE(senior_warden_email, '')) = LOWER(OLD.email) 
                        OR LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE senior_warden_name END,
                  senior_warden_phone = CASE 
                      WHEN LOWER(COALESCE(senior_warden_email, '')) = LOWER(OLD.email) 
                        OR LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE senior_warden_phone END,
                  senior_warden_email = CASE 
                      WHEN LOWER(COALESCE(senior_warden_email, '')) = LOWER(OLD.email) 
                        OR LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE senior_warden_email END,
                  admin_name = CASE 
                      WHEN LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE admin_name END,
                  admin_phone = CASE 
                      WHEN LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE admin_phone END,
                  admin_email = CASE 
                      WHEN LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE admin_email END,
                  warden_name = CASE 
                      WHEN LOWER(COALESCE(warden_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE warden_name END,
                  warden_phone = CASE 
                      WHEN LOWER(COALESCE(warden_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE warden_phone END,
                  warden_email = CASE 
                      WHEN LOWER(COALESCE(warden_email, '')) = LOWER(OLD.email) 
                      THEN NULL ELSE warden_email END
              WHERE LOWER(COALESCE(senior_warden_email, '')) = LOWER(OLD.email)
                 OR LOWER(COALESCE(admin_email, '')) = LOWER(OLD.email)
                 OR LOWER(COALESCE(warden_email, '')) = LOWER(OLD.email)
                 OR (OLD.hostel IS NOT NULL AND LOWER(id) = LOWER(OLD.hostel) AND OLD.role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN'));
          END IF;
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. Bind trigger to users table on DELETE
    console.log('[TRIGGER SETUP] 3. Binding trigger to users table on DELETE...');
    await query(`
      DROP TRIGGER IF EXISTS trg_cleanup_hostel_admin_on_user_delete ON users;
      CREATE TRIGGER trg_cleanup_hostel_admin_on_user_delete
      AFTER DELETE ON users
      FOR EACH ROW
      EXECUTE FUNCTION trg_cleanup_hostel_admin_on_user_delete();
    `);

    console.log('[TRIGGER SETUP SUCCESS] Trigger installed and active!');
    process.exit(0);
  } catch (err) {
    console.error('[TRIGGER SETUP ERROR]', err);
    process.exit(1);
  }
}

setupTrigger();

