import { query } from '../config/db.js';

async function migratePayments() {
  console.log('🔄 [MIGRATION] Running Razorpay & Payments schema enhancements...');

  try {
    // 1. Add Razorpay tracking columns to payments table
    await query(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
        ADD COLUMN IF NOT EXISTS failure_reason TEXT,
        ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS raw_response JSONB;
    `);

    // 2. Create performance & lookup indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_rzp_order ON payments(razorpay_order_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_rzp_payment ON payments(razorpay_payment_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);`);

    console.log('✅ [MIGRATION SUCCESS] Payments table successfully upgraded for Razorpay transaction handling!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [MIGRATION ERROR]', error);
    process.exit(1);
  }
}

migratePayments();
