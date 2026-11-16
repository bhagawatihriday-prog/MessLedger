import { pool, query, testConnection } from '../config/db.js';

async function cleanHostelDummyData() {
  console.log('[INFO] Connecting to database...');
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('[ERROR] Cannot connect to database.');
    process.exit(1);
  }

  try {
    console.log('[INFO] Resetting dummy admin and warden details, and syncing rooms from actual boarders...');
    await query(`
      UPDATE hostels
      SET senior_warden_name = NULL,
          senior_warden_phone = NULL,
          senior_warden_email = NULL,
          warden_name = NULL,
          warden_phone = NULL,
          warden_email = NULL,
          rooms = COALESCE(
            (
              SELECT array_agg(DISTINCT room ORDER BY room)
              FROM boarders
              WHERE LOWER(boarders.hostel) = LOWER(hostels.id)
                AND room IS NOT NULL AND TRIM(room) != ''
            ),
            '{}'
          );
    `);

    console.log('[INFO] Checking for any registered admins or wardens in users table to link...');
    const registeredAdminsRes = await query(`
      SELECT id, name, email, phone, role, hostel
      FROM users
      WHERE role IN ('ADMIN', 'SENIOR_WARDEN', 'WARDEN') AND hostel IS NOT NULL;
    `);

    for (const admin of registeredAdminsRes.rows) {
      const isWarden = admin.role === 'WARDEN';
      if (isWarden) {
        await query(`
          UPDATE hostels
          SET warden_name = $1,
              warden_email = $2,
              warden_phone = $3
          WHERE LOWER(id) = LOWER($4);
        `, [admin.name, admin.email, admin.phone, admin.hostel]);
        console.log(`[LINKED] Linked warden ${admin.name} (${admin.email}) to hostel ${admin.hostel}`);
      } else {
        await query(`
          UPDATE hostels
          SET senior_warden_name = $1,
              senior_warden_email = $2,
              senior_warden_phone = $3
          WHERE LOWER(id) = LOWER($4);
        `, [admin.name, admin.email, admin.phone, admin.hostel]);
        console.log(`[LINKED] Linked senior warden ${admin.name} (${admin.email}) to hostel ${admin.hostel}`);
      }
    }

    console.log('[INFO] Verifying updated hostels table:');
    const verifyRes = await query(`
      SELECT id, name, full_name, rooms, senior_warden_name, senior_warden_email, warden_name, warden_email 
      FROM hostels 
      ORDER BY name ASC;
    `);
    console.table(verifyRes.rows);

    console.log('[SUCCESS] Hostels table cleaned successfully.');
  } catch (err) {
    console.error('[ERROR] Failed to clean hostel dummy data:', err);
  } finally {
    await pool.end();
  }
}

cleanHostelDummyData();
