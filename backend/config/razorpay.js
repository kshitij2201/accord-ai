require('dotenv').config();
const Razorpay = require('razorpay');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Razorpay configuration with environment-based key selection
const razorpay = new Razorpay({
  key_id: isProduction 
    ? process.env.RAZORPAY_KEY_ID 
    : (process.env.RAZORPAY_TEST_KEY_ID || 'rzp_test_1234567890'),
  key_secret: isProduction 
    ? process.env.RAZORPAY_KEY_SECRET 
    : (process.env.RAZORPAY_TEST_KEY_SECRET || 'test_secret_key_1234567890')
});

// Log which environment we're using (without exposing keys)
console.log(`🔐 Razorpay initialized in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

module.exports = razorpay;
