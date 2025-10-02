import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { LoadingMessage } from './components/LoadingMessage';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { TrialBanner } from './components/TrialBanner';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UsageIndicator } from './components/UsageIndicator';
import { DatasetModal } from './components/DatasetModal';
import { LimitReachedBanner } from './components/LimitReachedBanner';
import PWAInstallBanner from './components/PWAInstallBanner';
import ConnectionStatus from './components/ConnectionStatus';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';
import { SubscriptionPlan } from './types/subscription';

function App() {
  const { messages, isLoading, error, sendMessage, sendFile, clearError } = useChat();
  const { 
    user, 
    loading: authLoading, 
    trialStatus, 
    isAnonymous, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail,
    requestPasswordReset,
    signOut,
    checkTrialStatus,
    getAuthToken
  } = useAuth();
  
  const {
    subscription,
    currentPlan,
    canSendMessage,
    messagesRemaining,
    subscribeToPlan,
    incrementMessageCount,
    getUsageStats
  } = useSubscription(user?.id);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Check if user should be prompted to sign in
  useEffect(() => {
    if (isAnonymous && trialStatus) {
      const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
      const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
      
      if (isExpired || isMessageLimitReached) {
        setShowAuthModal(true);
      }
    }
  }, [isAnonymous, trialStatus]);

  // Handle message sending with subscription checks
  const handleSendMessage = async (message: string) => {
    // Check subscription limits for authenticated users
    if (user && !canSendMessage) {
      console.log('🚫 Message limit reached for user, showing upgrade modal');
      setShowLimitBanner(true);
      setShowSubscriptionModal(true);
      return;
    }

    // Check trial restrictions for anonymous users
    if (isAnonymous && trialStatus) {
      const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
      const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
      
      if (isExpired || isMessageLimitReached) {
        console.log('🚫 Trial limit reached, showing auth modal');
        setShowAuthModal(true);
        return;
      }
    }

    try {
      // Get the current auth token
      const authToken = getAuthToken();
      
      console.log('🚀 handleSendMessage:', { 
        isAnonymous, 
        hasUser: !!user, 
        hasToken: !!authToken, 
        userEmail: user?.email,
        subscriptionStatus: subscription?.status,
        currentPlan: currentPlan?.name,
        canSendMessage,
        messagesRemaining
      });
      
      // Call sendMessage with proper authentication parameters
      await sendMessage(message, isAnonymous, authToken || undefined);
      
      // Increment message count for subscription tracking
      if (user?.id && subscription) {
        await incrementMessageCount();
      }
      
      // Update trial status for anonymous users
      if (isAnonymous) {
        await checkTrialStatus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file upload without restrictions
  const handleSendFile = async (file: File, customPrompt?: string) => {
    // Removed trial restrictions for free usage
    // if (isAnonymous && trialStatus) {
    //   const isExpired = trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime);
    //   const isMessageLimitReached = trialStatus.messageCount >= trialStatus.maxMessages;
    //   
    //   if (isExpired || isMessageLimitReached) {
    //     setShowAuthModal(true);
    //     return;
    //   }
    // }

    try {
      // Get the current auth token
      const authToken = getAuthToken();
      
      // Call sendFile with proper authentication parameters
      await sendFile(file, customPrompt, isAnonymous, authToken || undefined);
      
      // Update trial status for anonymous users
      if (isAnonymous) {
        await checkTrialStatus();
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  // Determine if we should show LoadingMessage
  const showLoadingMessage = isLoading && (
    messages.length === 0 ||
    messages[messages.length - 1].role !== 'assistant'
  );

  // Handle when AI finishes speaking (no auto-listen)
  const handleAssistantSpoken = () => {
    setIsSpeaking(false);
    // Removed automatic listening - user must click mic button manually
  };

  // When user finishes speaking, set message but don't auto-send
  const handleVoiceInput = (_text: string) => {
    setIsListening(false);
    // Voice input is now handled directly in ChatInput component
    // No auto-sending - user must click send button manually
  };

  // mark isTyping as used so the linter doesn't warn (we may use it later)
  useEffect(() => {}, [isTyping]);

  // Handle authentication actions
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const handleEmailSignUp = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName);
      setAuthSuccess(true);
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await requestPasswordReset(email);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Handle subscription plan selection
  const handleSelectPlan = async (plan: SubscriptionPlan, paymentId?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      console.log('🔄 Subscribing to plan:', plan.name, paymentId ? 'with payment ID:' : 'free plan', paymentId);
      const result = await subscribeToPlan(plan.id, paymentId);
      
      if (result.success) {
        console.log('✅ Subscription successful:', result.message);
        setShowSubscriptionModal(false);
        
        // Show success message
        alert(`Successfully subscribed to ${plan.name} plan!`);
      } else {
        console.error('❌ Subscription failed:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-4 border-purple-600 border-t-purple-400 border-r-violet-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-24 w-24 sm:h-32 sm:w-32 border-4 border-transparent border-b-violet-500 border-l-purple-500 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-purple-100 font-medium text-lg">🌸 Accord AI</p>
            <p className="text-purple-300 text-sm">Preparing your spiritual space...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 safe-area-inset-top safe-area-inset-bottom">
      {/* Usage Indicator */}
      {user && !isAnonymous && subscription && (
        <div className="fixed top-2 left-2 z-40 max-w-xs">
          <UsageIndicator
            used={getUsageStats().used}
            limit={getUsageStats().limit}
            planName={currentPlan?.name || 'Free'}
            onUpgrade={() => setShowSubscriptionModal(true)}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Trial Banner */}
      {isAnonymous && trialStatus && (
        <TrialBanner
          trialStatus={trialStatus}
          onSignInClick={() => setShowAuthModal(true)}
          isAnonymous={isAnonymous}
        />
      )}

      {/* Success Message */}
      {/* {authSuccess && (
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 bg-emerald-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl shadow-lg animate-fade-in max-w-[90vw] sm:max-w-none">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🌸</span>
            <span className="text-xs sm:text-sm font-medium">Welcome to your peaceful space</span>
          </div>
        </div>
      )} */}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSelectPlan={handleSelectPlan}
        currentPlan={subscription?.planId || 'free'}
      />
      


      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onForgotPassword={handleForgotPassword}
      />

      {/* Dataset Modal */}
      <DatasetModal
        isOpen={showDatasetModal}
        onClose={() => setShowDatasetModal(false)}
      />

      {/* Limit Reached Banner */}
      <LimitReachedBanner
        isVisible={Boolean(showLimitBanner && user && !canSendMessage)}
        onUpgrade={() => {
          setShowLimitBanner(false);
          setShowSubscriptionModal(true);
        }}
        onDismiss={() => setShowLimitBanner(false)}
        planName={currentPlan?.name || 'Free'}
        messagesUsed={getUsageStats().used}
        messageLimit={currentPlan?.messageLimit || 10}
      />

      <div className="flex flex-col h-screen mobile-scroll">
        {/* Header */}
        <ChatHeader 
          user={user}
          onSignOut={signOut}
          onSignInClick={() => setShowAuthModal(true)}
          onDatasetClick={() => setShowDatasetModal(true)}
          onUpgradeClick={() => {
            console.log('🎯 Upgrade button clicked!');
            setShowSubscriptionModal(true);
          }}
        />
        
        {/* Usage Indicator */}
        {user && subscription && (
          <div className="px-2 sm:px-3 md:px-4 py-2">
            <UsageIndicator
              used={getUsageStats()?.used || 0}
              limit={currentPlan?.messageLimit || 10}
              planName={currentPlan?.name || 'Free'}
              onUpgrade={() => setShowSubscriptionModal(true)}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden pb-24">
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 mobile-scroll">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto py-8">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isTyping={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                  onAssistantSpoken={index === messages.length - 1 && message.role === 'assistant' ? handleAssistantSpoken : undefined}
                  isSpeaking={isSpeaking && index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}
              {showLoadingMessage && <LoadingMessage />}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Fixed Input Area at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 backdrop-blur-xl z-30 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              isLoading={isLoading}
              error={error}
              isListening={isListening}
              onVoiceInput={handleVoiceInput}
              setIsListening={setIsListening}
              setIsTyping={setIsTyping}
              disabled={Boolean((user && !canSendMessage) || (isAnonymous && trialStatus && ((trialStatus.trialEndTime && new Date() > new Date(trialStatus.trialEndTime)) || trialStatus.messageCount >= trialStatus.maxMessages)))}
            />
          </div>
        </div>

      {/* PWA Components */}
      <ConnectionStatus />
      <PWAInstallBanner />
    </div>
    </div>
  );
}

export default App;