import { query } from '../config/db.js';

export async function initSessionsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(64) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(50),
        is_revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON user_sessions(refresh_token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
    `);
    console.log('  ✓ [DB INIT] user_sessions table and indexes verified.');
  } catch (err) {
    console.warn('  ⚠️ [DB INIT WARNING] Could not verify user_sessions table:', err.message);
  }
}
