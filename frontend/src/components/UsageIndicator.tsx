import React from 'react';
import { Crown, Zap, AlertTriangle } from 'lucide-react';

interface UsageIndicatorProps {
  used: number;
  limit: number;
  planName: string;
  onUpgrade?: () => void;
  className?: string;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  used,
  limit,
  planName,
  onUpgrade,
  className = ''
}) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.round((used / limit) * 100);
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getStatusColor = () => {
    if (isUnlimited) return 'text-purple-600';
    if (isAtLimit) return 'text-red-600';
    if (isNearLimit) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getIcon = () => {
    if (isUnlimited) return <Crown className="w-4 h-4" />;
    if (isAtLimit) return <AlertTriangle className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
<div className={`bg-white rounded-lg border border-gray-200 p-4 mt-6 ${className}`}>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={getStatusColor()}>
            {getIcon()}
          </span>
          <span className="font-medium text-gray-900">{planName} Plan</span>
        </div>
        {!isUnlimited && onUpgrade && (isNearLimit || isAtLimit) && (
          <button
            onClick={onUpgrade}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors"
          >
            Upgrad
          </button>
        )}
      </div>

      {isUnlimited ? (
        <div className="text-center py-2">
          <p className="text-purple-600 font-medium">Unlimited Messages</p>
          <p className="text-sm text-gray-500">Enjoy unlimited AI conversations</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Messages Used</span>
              <span>{used} / {limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isAtLimit ? (
              <div className="text-red-600">
                <p className="font-medium">Message limit reached</p>
                <p className="text-sm">Upgrade to continue chatting</p>
              </div>
            ) : isNearLimit ? (
              <div className="text-orange-600">
                <p className="font-medium">{remaining} messages remaining</p>
                <p className="text-sm">Consider upgrading soon</p>
              </div>
            ) : (
              <div className="text-green-600">
                <p className="font-medium">{remaining} messages remaining</p>
                <p className="text-sm">You're all set!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upgrade CTA for free users */}
      {planName === 'Free' && !isAtLimit && onUpgrade && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onUpgrade}
            className="w-full text-sm bg-gradient-to-r from-purple-600 to-violet-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all"
          >
            ✨ Upgrade for Unlimited Messages
          </button>
        </div>
      )}
    </div>
  );
};
