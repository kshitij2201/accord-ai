import React from 'react';
import { usePWA } from '../hooks/usePWA';

const ConnectionStatus: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="animate-pulse">📡</span>
          <span>You're offline. Some features may be limited.</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
