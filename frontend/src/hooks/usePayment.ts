import { useState } from 'react';
import { paymentService, CreateOrderRequest, PaymentVerification } from '../services/paymentService';
import { SubscriptionPlan } from '../types/subscription';

interface UsePaymentReturn {
  isProcessing: boolean;
  error: string | null;
  processPayment: (plan: SubscriptionPlan) => Promise<{ success: boolean; paymentId?: string; message?: string }>;
  clearError: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const processPayment = async (plan: SubscriptionPlan): Promise<{ success: boolean; paymentId?: string; message?: string }> => {
    if (plan.price === 0) {
      return { success: true, message: 'Free plan, no payment required' };
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Payment system is not available. Please refresh the page and try again.');
      }

      // Step 1: Create Razorpay order
      console.log('🚀 Creating payment order for plan:', plan.name);
      
      const orderRequest: CreateOrderRequest = {
        planId: plan.id,
        amount: plan.price,
        currency: 'INR'
      };

      const orderResult = await paymentService.createOrder(orderRequest);

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create payment order');
      }

      console.log('✅ Payment order created:', orderResult.order.id);

      // Step 2: Open Razorpay checkout
      return new Promise((resolve) => {
        paymentService.initializeRazorpay(
          orderResult.order!,
          async (razorpayResponse) => {
            try {
              // Step 3: Verify payment on backend
              console.log('🔍 Verifying payment:', razorpayResponse.razorpay_payment_id);
              
              const verificationData: PaymentVerification = {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              };

              const verificationResult = await paymentService.verifyPayment(verificationData);

              if (verificationResult.success) {
                console.log('✅ Payment verified successfully');
                resolve({
                  success: true,
                  paymentId: razorpayResponse.razorpay_payment_id,
                  message: 'Payment successful!'
                });
              } else {
                throw new Error(verificationResult.message || 'Payment verification failed');
              }
            } catch (verifyError: any) {
              console.error('❌ Payment verification error:', verifyError);
              setError(verifyError.message);
              resolve({
                success: false,
                message: verifyError.message
              });
            } finally {
              setIsProcessing(false);
            }
          },
          (paymentError) => {
            console.error('❌ Payment error:', paymentError);
            setError(paymentError.message || 'Payment failed');
            setIsProcessing(false);
            resolve({
              success: false,
              message: paymentError.message || 'Payment failed'
            });
          }
        );
      });

    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      setError(error.message);
      setIsProcessing(false);
      return {
        success: false,
        message: error.message
      };
    }
  };

  return {
    isProcessing,
    error,
    processPayment,
    clearError
  };
};
