import 'dotenv/config';
import app from './src/app.js';
import { testConnection } from './src/config/db.js';
import { initSessionsTable } from './src/db/initSessions.js';

const PORT = process.env.PORT || 5000;

// Pre-warm the database connection BEFORE the server starts accepting requests.
// This ensures the Neon WebSocket/TCP pool is fully established so the very
// first API call (e.g. Google Sign-In) never hits a cold-start connection delay.
(async () => {
  console.log(`===============================================`);
  console.log(`  MessLedger Server Starting on Port ${PORT}`);
  console.log(`  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`===============================================`);

  // Establish DB connection before listening for requests
  const isConnected = await testConnection();
  if (isConnected) {
    await initSessionsTable();
  }

  app.listen(PORT, () => {
    console.log(`  ✓ Server is now ready at http://localhost:${PORT}`);
    console.log(`  ✓ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
})();

