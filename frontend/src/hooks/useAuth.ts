import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  messageCount: number;
  isEmailVerified: boolean;
}

interface TrialStatus {
  isTrialActive: boolean;
  trialStartTime?: Date;
  trialEndTime?: Date;
  remainingTime: number;
  messageCount: number;
  maxMessages: number;
  isPremium?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Check trial status function - defined early so it can be used in useEffect
  const checkTrialStatus = async () => {
    try {
      if (user) {
        const response = await apiService.getTrialStatus();
        
        if (response && response.success) {
          setTrialStatus(response);
          return response;
        }
      } else {
        // For anonymous users
        const anonymousTrialStatus = {
          isTrialActive: true,
          trialStartTime: new Date(),
          trialEndTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          remainingTime: 30 * 60, // 30 minutes in seconds
          messageCount: 0,
          maxMessages: 10
        };
        
        setTrialStatus(anonymousTrialStatus);
        return anonymousTrialStatus;
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
      return null;
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (token && token !== 'null' && token !== 'undefined') {
          // Set token in API service
          apiService.setAuthToken(token);
          
          // Verify token with backend
          const response = await apiService.verifyToken();
          
          if (response.success) {
             setUser(response.user);
            setIsAnonymous(false);
            await checkTrialStatus();
          } else {
            // Token is invalid
            apiService.clearAuthToken();
            await checkTrialStatus();
          }
        } else {
          await checkTrialStatus();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Remove invalid token
        apiService.clearAuthToken();
        await checkTrialStatus();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Update trial status periodically
  useEffect(() => {
    if (trialStatus?.isTrialActive) {
      const timer = setInterval(async () => {
        await checkTrialStatus();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(timer);
    }
  }, [trialStatus, user]);

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const response = await apiService.register(email, password, displayName);

      if (response.success) {
        const { token, user: newUser } = response;
        
        // Store token using API service
        apiService.setAuthToken(token);
        
        setUser(newUser);
        setIsAnonymous(false);
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);

      if (response.success) {
        const { token, user: loggedInUser } = response;
        
        // Store token using API service
        apiService.setAuthToken(token);
        
        setUser(loggedInUser);
        setIsAnonymous(false);
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google using Firebase - Real Authentication
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting REAL Google authentication with Firebase...');
      
      // Use signInWithPopup for authentic Google sign-in
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result && result.user) {
        const googleUser = result.user;
        
        // Extract REAL user data from Google account
        const userData = {
          email: googleUser.email!,
          displayName: googleUser.displayName || googleUser.email!.split('@')[0],
          photoURL: googleUser.photoURL || '',
          googleId: googleUser.uid
        };
        
        console.log('🔍 REAL Google auth successful, user data:', userData);
        
        // Send REAL user data to backend for registration/login
        const response = await apiService.googleSignIn(userData);
        
        if (response.success) {
          const { token, user: backendUser } = response;
          
          // Store token using API service
          apiService.setAuthToken(token);
          
          setUser(backendUser);
          setIsAnonymous(false);
          
          console.log('✅ REAL Google authentication successful - No more demo accounts!');
          return { success: true, message: 'Google authentication successful' };
        } else {
          throw new Error(response.data.message);
        }
      } else {
        throw new Error('No user data received from Google');
      }
    } catch (error: any) {
      console.error('Google authentication error:', error);
      
      // Provide helpful error messages
      let message = 'Google authentication failed';
      
      if (error.code === 'auth/popup-blocked') {
        message = 'Popup was blocked by browser. Please allow popups and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled by user.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/forgot-password', {
        email: email.toLowerCase()
      });

      return { success: true, message: response.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Password reset request failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/reset-password', {
        token,
        password: newPassword
      });

      return { success: true, message: response.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Call backend to invalidate token (optional)
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        // Ignore logout errors from backend
        console.log('Backend logout error (ignored):', error);
      }
      
      // Clear auth token using API service
      apiService.clearAuthToken();
      
      setUser(null);
      setIsAnonymous(true);
      await checkTrialStatus();
      
      return { success: true, message: 'Signed out successfully' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Sign out failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Get current auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  return {
    user,
    loading,
    trialStatus,
    isAnonymous,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    requestPasswordReset,
    resetPassword,
    signOut,
    checkTrialStatus,
    getAuthToken
  };
};
