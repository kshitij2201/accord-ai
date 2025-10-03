import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import ErrorHandler from '../utils/errorHandler';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Allow overriding API base URL via Vite env var during development
    // If VITE_API_URL is not set, use relative '/api' so Vite dev proxy works.
    const envApiUrl = (import.meta as any)?.env?.VITE_API_URL;
    
    // Debug logging for environment configuration
    console.log('🔧 Environment check:', {
      envApiUrl,
      isDev: (import.meta as any)?.env?.DEV,
      mode: (import.meta as any)?.env?.MODE,
      allEnv: (import.meta as any)?.env
    });
    
    // Use backend URL in production, fallback to proxy in development
    const baseURL = envApiUrl && typeof envApiUrl === 'string' && envApiUrl.length > 0 
      ? envApiUrl 
      : 'https://accord-ai-ebon.vercel.app/api'; // Fallback to backend URL
    
    console.log('🌐 API Base URL:', baseURL);

    // Test backend connectivity immediately
    this.testBackendConnection(baseURL);

    // Create axios instance with proper configuration
    this.api = axios.create({
      baseURL,
      timeout: 30000, // Increased to 30 seconds for serverless cold starts
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token && token !== 'null' && token !== 'undefined') {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const handledError = ErrorHandler.handleApiError(error);
        ErrorHandler.logError(handledError, 'ApiService');
        
        if (error.response?.status === 401) {
          // Clear invalid token
          localStorage.removeItem('authToken');
          delete this.api.defaults.headers.common['Authorization'];
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Test backend connectivity
  private async testBackendConnection(baseURL: string) {
    try {
      console.log('🔗 Testing backend connection to:', baseURL);
      const response = await fetch(`${baseURL.replace('/api', '')}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      const text = await response.text();
      console.log('✅ Backend response:', response.status, text);
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
    }
  }

  // Auth endpoints
  async register(email: string, password: string, displayName: string) {
    try {
      const response = await this.api.post('/auth/register', {
        email: email.toLowerCase(),
        password,
        displayName
      });
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await this.api.post('/auth/login', {
        email: email.toLowerCase(),
        password
      });
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async verifyToken() {
    try {
      const response = await this.api.get('/auth/verify-token');
      return response.data;
    } catch (error: any) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  async googleSignIn(userData: any) {
    try {
      const response = await this.api.post('/auth/google', userData);
      return response.data;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async getTrialStatus() {
    const response = await this.api.get('/auth/trial-status');
    return response.data;
  }

  // AI endpoints
  async sendChatMessage(message: string, isAnonymous: boolean = false) {
  try {
    // If browser is offline, surface a clearer error
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineErr: any = new Error('You appear to be offline. Please check your internet connection.');
      offlineErr.code = 'ERR_INTERNET_DISCONNECTED';
      throw offlineErr;
    }
    const endpoint = isAnonymous ? '/ai/chat-anonymous' : '/ai/chat';
    const response = await this.api.post(endpoint, {
      message,
      isAnonymous
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('Daily message limit reached. Please try again tomorrow.');
    }
    throw error;
  }
}


  // Subscription endpoints
  async getSubscriptionStatus() {
    const response = await this.api.get('/subscription/status');
    return response.data;
  }

  async subscribe(planId: string, paymentId?: string) {
    const response = await this.api.post('/subscription/subscribe', {
      planId,
      paymentId
    });
    return response.data;
  }

  // Generic methods
  async get(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem('authToken', token);
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem('authToken');
    delete this.api.defaults.headers.common['Authorization'];
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;