import React from 'react';
import { Bot, Sparkles, User, LogOut, Database } from 'lucide-react';

interface ChatHeaderProps {
  user?: {
    displayName: string;
    email: string;
    photoURL?: string;
  } | null;
  onSignOut?: () => void;
  onSignInClick?: () => void;
  onDatasetClick?: () => void;
  onUpgradeClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onSignOut,
  onSignInClick,
  onDatasetClick,
  onUpgradeClick
}) => {
  return (
    <div className="border-b border-gray-300/30 bg-black/90 backdrop-blur-md sticky top-0 z-20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Bot size={24} />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Accord AI
              </h1>
              <Sparkles size={18} className="text-yellow-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 hidden sm:block">Multilingual AI Assistant</p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          
          {/* Admin Dataset Button */}
          {user?.email === 'admin@accordai.com' && (
            <button
              onClick={onDatasetClick}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="Manage Dataset (Admin Only)"
            >
              <Database size={20} />
            </button>
          )}

          {/* Upgrade Button */}
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm transform hover:scale-105"
            title="Upgrade to Premium"
          >
            ⭐ Upgrade
          </button>

          {/* Online Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Online</span>
          </div>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                    <User size={18} />
                  </div>
                )}
                <div className="hidden sm:flex flex-col truncate max-w-[120px]">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Sign Out */}
              <button
                onClick={onSignOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm transform hover:scale-105"
            >
              Sign In
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
