const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory subscription storage (replace with database in production)
const subscriptions = new Map();
const paymentHistory = new Map();

// Helper to normalize user id (accepts either req.user.userId or req.user._id and returns a string)
function resolveUserId(req) {
  if (!req || !req.user) return null;
  const raw = req.user.userId || req.user._id;
  if (raw == null) return null;
  // If it's an ObjectId or object, toString() will produce a usable id string
  return typeof raw === 'string' ? raw : (raw.toString ? raw.toString() : String(raw));
}

// Subscription plans (should match frontend)
const SUBSCRIPTION_PLANS = {
  'free': {
    id: 'free',
    name: 'Free',
    price: 0,
    messageLimit: 10,
    features: ['10 messages per day', 'Basic AI responses']
  },
  'basic_monthly': {
    id: 'basic_monthly',
    name: 'Basic',
    price: 599,
    messageLimit: 500,
    duration: 'monthly',
    features: ['500 messages per month', 'Enhanced AI responses']
  },
  'basic_yearly': {
    id: 'basic_yearly',
    name: 'Basic',
    price: 5999,
    messageLimit: 500,
    duration: 'yearly',
    features: ['500 messages per month', 'Enhanced AI responses', '2 months free']
  },
  'pro_monthly': {
    id: 'pro_monthly',
    name: 'Pro',
    price: 1499,
    messageLimit: -1, // unlimited
    duration: 'monthly',
    features: ['Unlimited messages', 'Advanced AI model', 'Priority support']
  },
  'pro_yearly': {
    id: 'pro_yearly',
    name: 'Pro',
    price: 14999,
    messageLimit: -1,
    duration: 'yearly',
    features: ['Unlimited messages', 'Advanced AI model', 'Priority support', '2 months free']
  },
  'enterprise': {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    messageLimit: -1,
    duration: 'monthly',
    features: ['Everything in Pro', 'Team collaboration', 'API access']
  }
};

// Get subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    console.log('📊 Getting subscription status for user:', userId);
    
    let subscription = subscriptions.get(userId);
    
    if (!subscription) {
      // Create default free subscription
      subscription = {
        id: `sub_${Date.now()}_${userId}`,
        userId,
        planId: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: false,
        messagesUsed: 0,
        messagesLimit: 10,
        createdAt: new Date()
      };
      subscriptions.set(userId, subscription);
      console.log('✅ Created default free subscription for user:', userId);
    }
    
    res.json({
      success: true,
      subscription,
      plan: SUBSCRIPTION_PLANS[subscription.planId]
    });
  } catch (error) {
    console.error('❌ Subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
});

// Subscribe to a plan
router.post('/subscribe', auth, async (req, res) => {
  try {
  const userId = resolveUserId(req);
  const { planId, paymentId } = req.body;
    
  console.log('💳 Processing subscription for user:', userId, 'plan:', planId);
    
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    const plan = SUBSCRIPTION_PLANS[planId];
    
    // For free plan, no payment required
    if (planId === 'free') {
      const subscriptionId = `sub_${Date.now()}_${userId}`;
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const subscription = {
        id: subscriptionId,
        userId,
        planId,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        messagesUsed: 0,
        messagesLimit: plan.messageLimit,
        createdAt: new Date()
      };
      
      subscriptions.set(userId, subscription);
      
      return res.json({
        success: true,
        message: 'Successfully subscribed to free plan',
        subscription,
        requiresPayment: false
      });
    }
    
    // For paid plans, require payment confirmation
    if (!paymentId) {
      return res.json({
        success: true,
        message: 'Payment required for this plan',
        requiresPayment: true,
        plan: {
          id: planId,
          name: plan.name,
          price: plan.price,
          currency: 'INR'
        }
      });
    }
    
    // If payment ID provided, create subscription (payment should be verified separately)
    const subscriptionId = `sub_${Date.now()}_${userId}`;
    const startDate = new Date();
    let endDate;
    
    if (plan.duration === 'yearly') {
      endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else {
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month
    }
    
    const subscription = {
      id: subscriptionId,
      userId,
      planId,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
      messagesUsed: 0,
      messagesLimit: plan.messageLimit,
      paymentId,
      createdAt: new Date()
    };
    
    subscriptions.set(userId, subscription);
    
    // Record payment history for paid plans
    if (plan.price > 0) {
      const payment = {
        id: paymentId,
        userId,
        planId,
        subscriptionId,
        amount: plan.price,
        currency: 'INR',
        status: 'completed',
        paymentDate: new Date(),
        paymentMethod: 'razorpay',
        transactionId: paymentId
      };
      paymentHistory.set(payment.id, payment);
    }
    
    console.log('✅ Subscription created successfully:', subscription);
    
    res.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan!`,
      subscription
    });
    
  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
  const userId = resolveUserId(req);
  console.log('❌ Cancelling subscription for user:', userId);
    
  const subscription = subscriptions.get(userId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Update subscription status
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    
    subscriptions.set(userId, subscription);
    
    console.log('✅ Subscription cancelled successfully');
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You can continue using the service until the end of your billing period.',
      subscription
    });
    
  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Increment message usage
router.post('/increment-usage', auth, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    console.log('Debug2 resolved userId:', userId, 'raw req.user:', req.user);

    if (!userId) {
      console.warn('No userId available on req.user in /increment-usage');
      return res.status(400).json({ success: false, message: 'Invalid user information' });
    }

    const subscription = subscriptions.get(userId);
    console.log('Debug3', subscription)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }
    
    // Don't increment for unlimited plans
    if (subscription.messagesLimit === -1) {
      return res.json({
        success: true,
        message: 'Unlimited plan - no usage tracking needed'
      });
    }
    
    subscription.messagesUsed += 1;
    subscription.lastUsed = new Date();
    
    subscriptions.set(userId, subscription);
    
    console.log(`📈 Message count incremented for user ${userId}: ${subscription.messagesUsed}/${subscription.messagesLimit}`);
    
    res.json({
      success: true,
      messagesUsed: subscription.messagesUsed,
      messagesLimit: subscription.messagesLimit,
      remaining: Math.max(0, subscription.messagesLimit - subscription.messagesUsed)
    });
    
  } catch (error) {
    console.error('❌ Increment usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update usage'
    });
  }
});

// Get usage statistics
router.get('/usage', auth, async (req, res) => {
  try {
  const userId = resolveUserId(req);
    
  const subscription = subscriptions.get(userId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }
    
    const plan = SUBSCRIPTION_PLANS[subscription.planId];
    const isUnlimited = subscription.messagesLimit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, subscription.messagesLimit - subscription.messagesUsed);
    const percentage = isUnlimited ? 0 : Math.round((subscription.messagesUsed / subscription.messagesLimit) * 100);
    
    res.json({
      success: true,
      usage: {
        used: subscription.messagesUsed,
        limit: subscription.messagesLimit,
        remaining,
        percentage,
        isUnlimited,
        planName: plan.name,
        resetDate: subscription.endDate
      }
    });
    
  } catch (error) {
    console.error('❌ Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics'
    });
  }
});

// Get payment history
router.get('/payments', auth, async (req, res) => {
  try {
  const userId = resolveUserId(req);
    
  const userPayments = Array.from(paymentHistory.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    
    res.json({
      success: true,
      payments: userPayments
    });
    
  } catch (error) {
    console.error('❌ Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
});

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    res.json({
      success: true,
      plans: Object.values(SUBSCRIPTION_PLANS)
    });
  } catch (error) {
    console.error('❌ Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans'
    });
  }
});

module.exports = router;
