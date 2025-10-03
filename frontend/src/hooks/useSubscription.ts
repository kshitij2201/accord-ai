import { useState, useEffect } from 'react';
import axios from 'axios';
import { SUBSCRIPTION_PLANS, UserSubscription } from '../types/subscription';

const API_BASE_URL = 'https://accord-ai-ebon.vercel.app/api';

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  currentPlan: any;
  isSubscribed: boolean;
  canSendMessage: boolean;
  messagesRemaining: number;
  subscribeToPlan: (planId: string, paymentId?: string) => Promise<{ success: boolean; message: string }>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
  incrementMessageCount: () => Promise<void>;
  getUsageStats: () => { used: number; limit: number; percentage: number };
}

export const useSubscription = (userId?: string): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current plan details
  const currentPlan = subscription 
    ? SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.planId) || SUBSCRIPTION_PLANS[0]
    : SUBSCRIPTION_PLANS[0]; // Default to free plan

  const isSubscribed = subscription?.status === 'active' && subscription.planId !== 'free';
  
  const messagesRemaining = subscription 
    ? Math.max(0, subscription.messagesLimit - subscription.messagesUsed)
    : 10; // Default free tier limit

  const canSendMessage = currentPlan?.messageLimit === -1 || messagesRemaining > 0;

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        setSubscription(response.data.subscription);
      } else {
        // Set default free subscription
        setSubscription({
          id: 'free_' + userId,
          userId,
          planId: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: false,
          messagesUsed: 0,
          messagesLimit: 10
        });
      }
    } catch (error: any) {
      console.error('Subscription status check error:', error);
      setError(error.response?.data?.message || 'Failed to check subscription');
      
      // Fallback to free plan
      setSubscription({
        id: 'free_' + (userId || 'anonymous'),
        userId: userId || 'anonymous',
        planId: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        messagesUsed: 0,
        messagesLimit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to a plan
  const subscribeToPlan = async (planId: string, paymentId?: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const requestData: any = { planId };
      if (paymentId) {
        requestData.paymentId = paymentId;
      }

      const response = await axios.post(`${API_BASE_URL}/subscription/subscribe`, requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        setSubscription(response.data.subscription);
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to subscribe';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE_URL}/subscription/cancel`, {
        userId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        await checkSubscriptionStatus(); // Refresh subscription data
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to cancel subscription';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Increment message count
  const incrementMessageCount = async () => {
    try {
      await axios.post(`${API_BASE_URL}/subscription/increment-usage`,{}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      // Update local state
      if (subscription) {
        setSubscription({
          ...subscription,
          messagesUsed: subscription.messagesUsed + 1
        });
      }
    } catch (error) {
      console.error('Failed to increment message count:', error);
    }
  };

  // Get usage statistics
  const getUsageStats = () => {
    if (!subscription) {
      return { used: 0, limit: 10, percentage: 0 };
    }

    const used = subscription.messagesUsed;
    const limit = subscription.messagesLimit;
    const percentage = limit === -1 ? 0 : Math.round((used / limit) * 100);

    return { used, limit, percentage };
  };

  // Load subscription status on mount and user change
  useEffect(() => {
    checkSubscriptionStatus();
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    currentPlan,
    isSubscribed,
    canSendMessage,
    messagesRemaining,
    subscribeToPlan,
    cancelSubscription,
    incrementMessageCount,
    getUsageStats
  };
};
