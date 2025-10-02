import React from 'react';
import { Crown, AlertTriangle, X } from 'lucide-react';

interface LimitReachedBannerProps {
  isVisible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
  planName: string;
  messagesUsed: number;
  messageLimit: number;
}

export const LimitReachedBanner: React.FC<LimitReachedBannerProps> = ({
  isVisible,
  onUpgrade,
  onDismiss,
  planName,
  messagesUsed,
  messageLimit
}) => {
  if (!isVisible) return null;

  return (
   <div className="fixed top-12 md:top-22 left-2 md:left-4 right-2 md:right-4 z-50 max-w-4xl mx-auto">

      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm md:text-base">Message Limit Reached!</h3>
              <p className="text-xs md:text-sm opacity-90 truncate">
                You've used {messagesUsed}/{messageLimit} messages on your {planName} plan
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={onUpgrade}
              className="bg-white text-orange-600 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Crown className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Upgrade Now</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 md:p-2 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};