import axios from 'axios';

const API_BASE_URL = '/api';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface CreateOrderRequest {
  planId: string;
  amount: number;
  currency?: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: {
    paymentId: string;
    orderId: string;
    planId: string;
    amount: number;
  };
}

class PaymentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Authentication required. Please login again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createOrder(orderData: CreateOrderRequest): Promise<{ success: boolean; order?: PaymentOrder & { key: string }; message?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/payment/create-order`, orderData, {
        headers: this.getAuthHeaders(),
        timeout: 10000 // 10 second timeout
      });

      return {
        success: response.data.success,
        order: response.data.success ? {
          ...response.data.order,
          key: response.data.key
        } : undefined,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('❌ Error creating payment order:', error);
      
      let errorMessage = 'Failed to create payment order';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async verifyPayment(paymentData: PaymentVerification): Promise<PaymentResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/payment/verify-payment`, paymentData, {
        headers: this.getAuthHeaders(),
        timeout: 15000 // 15 second timeout for verification
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error verifying payment:', error);
      
      let errorMessage = 'Failed to verify payment';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Payment verification timeout. Please contact support if amount was deducted.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed during payment verification.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error during payment verification. Please contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async getPaymentHistory(): Promise<{ success: boolean; payments?: any[]; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/history`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching payment history:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch payment history'
      };
    }
  }

  // Initialize Razorpay checkout
  initializeRazorpay(order: PaymentOrder & { key: string }, onSuccess: (response: any) => void, onError: (error: any) => void) {
    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Accord AI',
      description: 'Subscription Payment',
      order_id: order.id,
      handler: (response: any) => {
        console.log('✅ Payment successful:', response);
        onSuccess(response);
      },
      prefill: {
        name: 'User Name',
        email: 'user@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: () => {
          console.log('💔 Payment cancelled by user');
          onError(new Error('Payment cancelled by user'));
        }
      }
    };

    // Check if Razorpay is loaded
    if (typeof (window as any).Razorpay !== 'undefined') {
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } else {
      console.error('❌ Razorpay SDK not loaded');
      onError(new Error('Razorpay SDK not loaded'));
    }
  }
}

export const paymentService = new PaymentService();
