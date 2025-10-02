import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, User } from 'lucide-react';

interface TrialBannerProps {
  trialStatus: {
    isTrialActive: boolean;
    trialEndTime?: Date;
    remainingTime: number;
    messageCount: number;
    maxMessages: number;
    isPremium?: boolean;
  } | null;
  onSignInClick: () => void;
  isAnonymous: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  trialStatus,
  onSignInClick,
  isAnonymous
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!trialStatus || !trialStatus.trialEndTime || !isAnonymous) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date(trialStatus.trialEndTime!);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [trialStatus, isAnonymous]);

  if (!isAnonymous || !trialStatus || trialStatus.isPremium) {
    return null;
  }

  const remainingMessages = Math.max(0, trialStatus.maxMessages - trialStatus.messageCount);
  const isExpired = !trialStatus.isTrialActive || remainingMessages === 0 || timeLeft === 'Expired';

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4 shadow-soft mx-2 sm:mx-3 md:mx-4">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <User className="text-orange-100 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">✨ Trial Complete</h3>
              <p className="text-orange-100 text-xs sm:text-sm">
                Ready to continue your journey?
              </p>
            </div>
          </div>
          <button
            onClick={onSignInClick}
            className="bg-white text-orange-600 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-md sm:rounded-lg font-medium hover:bg-orange-50 transition-colors text-xs sm:text-sm whitespace-nowrap touch-target"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

 return (
  <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-500 to-violet-500  text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4 shadow-soft mx-2 sm:mx-3 md:mx-4">
    <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-1 sm:gap-2">
          <Clock className="text-purple-100 flex-shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span className="font-medium text-xs sm:text-sm md:text-base">{timeLeft}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <MessageSquare className="text-purple-100 flex-shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span className="font-medium text-xs sm:text-sm md:text-base">{remainingMessages} left</span>
        </div>
      </div>
      <button
        onClick={onSignInClick}
        className="bg-white text-purple-600 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-md sm:rounded-lg font-medium hover:bg-purple-50 transition-colors text-xs sm:text-sm whitespace-nowrap touch-target"
      >
        <span className="hidden sm:inline">Sign In for Unlimited</span>
        <span className="sm:hidden">Sign In</span>
      </button>
    </div>
    <div className="mt-2 sm:mt-3">
      <div className="w-full bg-blue-300 bg-opacity-30 rounded-full h-1.5 sm:h-2">
        <div
          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(10, (remainingMessages / trialStatus.maxMessages) * 100)}%`
          }}
        />
      </div>
      <p className="text-xs text-purple-100 mt-1 text-center">
        🌱 Your mindful trial experience
      </p>
    </div>
  </div>
);

};
