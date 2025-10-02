import React, { useState, useEffect } from 'react';
import { X, Check, Crown, Zap, Users } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../types/subscription';
import { usePayment } from '../hooks/usePayment';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan, paymentId?: string) => void;
  currentPlan?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan = 'free',
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'yearly'>('monthly');
  const [showModal, setShowModal] = useState(isOpen);
  const { isProcessing, error, processPayment, clearError } = usePayment();

  useEffect(() => {
    if (isOpen) setShowModal(true);
  }, [isOpen]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300); // delay to allow animation
  };

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    clearError();
    if (plan.price === 0) {
      onSelectPlan(plan);
      return;
    }
    if (typeof (window as any).Razorpay === 'undefined') {
      console.error('Razorpay SDK not available');
      return;
    }
    const paymentResult = await processPayment(plan);
    if (paymentResult.success) onSelectPlan(plan, paymentResult.paymentId);
  };

  if (!isOpen && !showModal) return null;

  const filteredPlans = SUBSCRIPTION_PLANS.filter(
    (plan) => plan.duration === selectedDuration || plan.id === 'free'
  );

  const getPlanIcon = (planId: string) => {
    if (planId.includes('pro')) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (planId.includes('enterprise')) return <Users className="w-6 h-6 text-purple-500" />;
    if (planId.includes('basic')) return <Zap className="w-6 h-6 text-purple-500" />;
    return <Check className="w-6 h-6 text-green-500" />;
  };

  const formatPrice = (price: number, duration: string) => {
    if (price === 0) return 'Free';
    return `₹${price.toLocaleString('en-IN')}/${duration === 'yearly' ? 'year' : 'month'}`;
  };

  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    if (plan.duration === 'yearly') {
      const monthlyPrice = Math.round(plan.price / 12);
      return `₹${monthlyPrice.toLocaleString('en-IN')}/month`;
    }
    return null;
  };

  return (
<div
  className={`fixed inset-0 z-40 flex items-start justify-center p-4 pt-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
>

      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden relative shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`}
      >
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm flex items-center justify-center rounded-3xl z-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-200 font-medium">Processing payment...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Unlock unlimited conversations & premium features</p>
            </div>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <X className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            </button>
          </div>

          {/* Duration Toggle */}
          <div className="flex items-center justify-center mt-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex w-full max-w-xs shadow-inner">
              {['monthly', 'yearly'].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSelectedDuration(duration as 'monthly' | 'yearly')}
                  className={`flex-1 px-5 py-2 rounded-xl font-medium text-sm md:text-base transition ${
                    selectedDuration === duration
                      ? 'bg-white dark:bg-gray-900 text-purple-600 shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  } relative`}
                >
                  {duration.charAt(0).toUpperCase() + duration.slice(1)}
                  {duration === 'yearly' && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Save 17%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Plans Row */}
        <div className="p-6 overflow-x-hidden">
          <div className="flex flex-row gap-6 w-full">
            {filteredPlans.map((plan) => (
<div
  key={plan.id}
  className={`flex-1 min-w-[220px] relative p-4 rounded-2xl border-2 transition-transform transform hover:scale-105 ${
    plan.isPopular
      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
      : currentPlan === plan.id
      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
      : 'border-gray-200 bg-white dark:bg-gray-800'
  }`}
>

                {/* Badges */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow">
                    🔥 Most Popular
                  </div>
                )}
                {currentPlan === plan.id && (
                  <div className="absolute -top-4 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow">
                    ✅ Current
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(plan.price, plan.duration)}
                  </div>
                  {getMonthlyPrice(plan) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getMonthlyPrice(plan)} billed annually
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={currentPlan === plan.id || isProcessing}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : plan.price === 0
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Continue Free'
                  ) : (
                    <>Upgrade - ₹{plan.price.toLocaleString('en-IN')}</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-black-900 text-center text-xs text-gray-600 dark:text-gray-300">
          <p>✨ 24/7 support & regular updates</p>
          <p className="mt-1">💳 Secure payment • 🔒 Cancel anytime • 📧 No spam</p>
        </div>
      </div>
    </div>
  );
};
