import React from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallBanner: React.FC = () => {
  const { showInstallPrompt, installApp, dismissInstallPrompt, isOnline } = usePWA();

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              📱
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Install Accord AI
            </h3>
            <p className="text-xs opacity-90 mb-3">
              Get the full app experience with offline access and faster loading
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={installApp}
                className="bg-white text-purple-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={dismissInstallPrompt}
                className="bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-white/30 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={dismissInstallPrompt}
            className="flex-shrink-0 text-white/70 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
        
        {!isOnline && (
          <div className="mt-3 p-2 bg-orange-500/20 rounded text-xs">
            📡 You're offline. Install to access cached content!
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallBanner;
