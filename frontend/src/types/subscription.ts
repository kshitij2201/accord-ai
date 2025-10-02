export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly';
  features: string[];
  messageLimit: number;
  isPopular?: boolean;
  discount?: number; // for yearly plans
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  messagesUsed: number;
  messagesLimit: number;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
}

// Predefined subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration: 'monthly',
    features: [
      '10 messages per day',
      'Basic AI responses',
      'Text chat only',
      'Community support'
    ],
    messageLimit: 10
  },
  {
    id: 'basic_monthly',
    name: 'Basic',
    price: 599,
    currency: 'INR',
    duration: 'monthly',
    features: [
      '500 messages per month',
      'Enhanced AI responses',
      'Voice chat included',
      'File upload support',
      'Email support'
    ],
    messageLimit: 500
  },
  {
    id: 'basic_yearly',
    name: 'Basic',
    price: 5999,
    currency: 'INR',
    duration: 'yearly',
    features: [
      '500 messages per month',
      'Enhanced AI responses',
      'Voice chat included',
      'File upload support',
      'Email support',
      '2 months free'
    ],
    messageLimit: 500,
    discount: 17 // 2 months free = ~17% discount
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 1499,
    currency: 'INR',
    duration: 'monthly',
    features: [
      'Unlimited messages',
      'Advanced AI model',
      'Voice chat & synthesis',
      'Priority file processing',
      'Custom prompts',
      'Priority support'
    ],
    messageLimit: -1, // -1 = unlimited
    isPopular: true
  },
  {
    id: 'pro_yearly',
    name: 'Pro',
    price: 14999,
    currency: 'INR',
    duration: 'yearly',
    features: [
      'Unlimited messages',
      'Advanced AI model',
      'Voice chat & synthesis',
      'Priority file processing',
      'Custom prompts',
      'Priority support',
      '2 months free'
    ],
    messageLimit: -1,
    isPopular: true,
    discount: 17
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    currency: 'INR',
    duration: 'monthly',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    messageLimit: -1
  }
];
