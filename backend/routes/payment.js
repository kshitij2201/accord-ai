const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// In-memory payment storage (replace with database in production)
const payments = new Map();
const orders = new Map();

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planId, amount, currency = 'INR' } = req.body;
    
    if (!planId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan ID and amount are required' 
      });
    }

    console.log('💳 Creating Razorpay order for user:', req.userId, 'Plan:', planId, 'Amount:', amount);

    const options = {
      amount: amount * 100, // Amount in paise (smallest currency unit)
      currency: currency,
      receipt: `order_${Date.now()}`,
      notes: {
        planId: planId,
        userId: req.userId
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Store order details
    orders.set(order.id, {
      orderId: order.id,
      userId: req.userId,
      planId: planId,
      amount: amount,
      currency: currency,
      status: 'created',
      createdAt: new Date()
    });

    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890'
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order: ' + error.message 
    });
  }
});

// Verify payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing payment verification data' 
      });
    }

    console.log('🔍 Verifying payment for order:', razorpay_order_id);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_1234567890')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.log('❌ Payment signature verification failed');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

    // Get order details
    const orderDetails = orders.get(razorpay_order_id);
    if (!orderDetails) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Store payment details
    const paymentData = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId: req.userId,
      planId: orderDetails.planId,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      status: 'completed',
      verifiedAt: new Date(),
      signature: razorpay_signature
    };

    payments.set(razorpay_payment_id, paymentData);
    
    // Update order status
    orderDetails.status = 'paid';
    orderDetails.paymentId = razorpay_payment_id;
    orders.set(razorpay_order_id, orderDetails);

    console.log('✅ Payment verified successfully for user:', req.userId, 'Plan:', orderDetails.planId);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        planId: orderDetails.planId,
        amount: orderDetails.amount
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed: ' + error.message 
    });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const userPayments = Array.from(payments.values())
      .filter(payment => payment.userId === req.userId)
      .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt));

    res.json({
      success: true,
      payments: userPayments
    });

  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history' 
    });
  }
});

// Webhook for Razorpay (for production)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const event = req.body.event;
    const payloadData = req.body.payload;

    console.log('📢 Razorpay webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Payment successful
        console.log('✅ Payment captured:', payloadData.payment.entity.id);
        break;
      case 'payment.failed':
        // Payment failed
        console.log('❌ Payment failed:', payloadData.payment.entity.id);
        break;
      default:
        console.log('📝 Unhandled webhook event:', event);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

module.exports = router;
