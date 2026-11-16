import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || 'rzp_test_messledger12345').trim();
export const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
export const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

// Determine if valid production or sandbox keys are supplied
export const isRazorpayConfigured = Boolean(
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  !RAZORPAY_KEY_ID.includes('placeholder') &&
  !RAZORPAY_KEY_ID.includes('your_key_id') &&
  !RAZORPAY_KEY_SECRET.includes('your_razorpay_secret')
);

let razorpayInstance = null;

if (isRazorpayConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    console.log('✅ [RAZORPAY] Client SDK initialized successfully with Key ID:', RAZORPAY_KEY_ID.substring(0, 10) + '...');
  } catch (err) {
    console.error('❌ [RAZORPAY INIT ERROR]', err.message);
  }
} else {
  console.log('ℹ️ [RAZORPAY] Live/Sandbox API keys not provided in .env. Operating in Simulation & Development Mode.');
}

export const getRazorpayInstance = () => razorpayInstance;

export default {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  isRazorpayConfigured,
  getRazorpayInstance,
};
