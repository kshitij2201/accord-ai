// Centralized error handling utility

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handleApiError(error: any): AppError {
    console.error('API Error:', error);

    // Network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    }

    // HTTP errors
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          status
        };
      
      case 401:
        return {
          message: data?.message || 'Authentication failed. Please login again.',
          code: 'UNAUTHORIZED',
          status
        };
      
      case 403:
        return {
          message: data?.message || 'Access denied. You don\'t have permission.',
          code: 'FORBIDDEN',
          status
        };
      
      case 404:
        return {
          message: data?.message || 'Resource not found.',
          code: 'NOT_FOUND',
          status
        };
      
      case 429:
        return {
          message: data?.message || 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
          status
        };
      
      case 500:
        return {
          message: data?.message || 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          status
        };
      
      default:
        return {
          message: data?.message || 'An unexpected error occurred.',
          code: 'UNKNOWN_ERROR',
          status
        };
    }
  }

  static handleAuthError(error: any): AppError {
    const apiError = this.handleApiError(error);
    
    // Clear auth token on authentication errors
    if (apiError.status === 401) {
      localStorage.removeItem('authToken');
    }
    
    return apiError;
  }

  static handleChatError(error: any): AppError {
    const apiError = this.handleApiError(error);
    
    // Provide chat-specific error messages
    if (apiError.code === 'RATE_LIMITED') {
      return {
        ...apiError,
        message: 'You\'re sending messages too quickly. Please wait a moment.'
      };
    }
    
    return apiError;
  }

  static logError(error: AppError, context?: string) {
    console.error(`[${context || 'App'}] Error:`, error);
    
    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (e.g., Sentry, LogRocket)
    }
  }
}

export default ErrorHandler;