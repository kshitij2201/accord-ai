import React from 'react';
import { Bot } from 'lucide-react';

export const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
        <Bot size={18} />
      </div>
      
      <div className="max-w-[75%]">
        <div className="inline-block p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-slate-500">Accord is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};