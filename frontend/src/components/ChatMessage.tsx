import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onAssistantSpoken?: () => void;
  isSpeaking?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onAssistantSpoken, isSpeaking }) => {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Handle typing animation for assistant messages
  useEffect(() => {
    if (isUser) {
      setDisplayedContent(message.content);
      return;
    }

    if (message.content.length === 0) {
      setDisplayedContent('');
      setCurrentIndex(0);
      setHasSpoken(false);
      return;
    }

    // If content is shorter than before, reset animation
    if (message.content.length < displayedContent.length) {
      setDisplayedContent(message.content);
      setCurrentIndex(message.content.length);
      setHasSpoken(false);
      return;
    }

    // If content is longer, animate the new characters
    if (message.content.length > displayedContent.length) {
      const newContent = message.content.slice(0, currentIndex + 1);
      setDisplayedContent(newContent);
      
      if (currentIndex < message.content.length - 1) {
        const timer = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 30); // Adjust speed here (lower = faster)
        
        return () => clearTimeout(timer);
      }
    }
  }, [message.content, isUser, currentIndex, displayedContent.length]);

  // Manual speech synthesis (auto-speak disabled)
  useEffect(() => {
    // Auto-speak disabled - user must manually click mic button for voice features
    // if (!isUser && displayedContent && !isTyping && !hasSpoken) {
    //   window.speechSynthesis.cancel();
    //   const utter = new window.SpeechSynthesisUtterance(displayedContent);
    //   utter.lang = 'en-US'; // Set to 'hi-IN' for Hindi
    //   utter.onend = () => {
    //     setHasSpoken(true);
    //     if (onAssistantSpoken) onAssistantSpoken();
    //   };
    //   utter.onerror = () => {
    //     setHasSpoken(true);
    //     if (onAssistantSpoken) onAssistantSpoken();
    //   };
    //   utteranceRef.current = utter;
    //   window.speechSynthesis.speak(utter);
    // }
    
    // Stop any ongoing speech when component unmounts or message changes
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [displayedContent, isUser, isTyping, hasSpoken, onAssistantSpoken]);

  return (
    <div className={`flex items-start gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
          : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
      }`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className={`max-w-[75%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-2xl shadow-sm relative ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
            : 'bg-white border border-slate-200 text-slate-800'
        }`}>
          {!isUser && isTyping && message.content.length === 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-slate-500">Accord is thinking...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {displayedContent}
              {!isUser && isTyping && (
                <span className="inline-block w-0.5 h-4 bg-slate-400 ml-1 animate-pulse"></span>
              )}
            </p>
          )}
        </div>
        
        <div className={`mt-2 text-xs text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
          <span className="hidden xs:inline">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="xs:hidden">
            {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          
          {/* Language and source indicators for assistant messages */}
          {!isUser && (message.detectedLanguage || message.source) && (
            <span className="ml-1 sm:ml-2 text-xs">
              {message.detectedLanguage && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 mr-1">
                  🌐 {message.detectedLanguage}
                </span>
              )}
              {message.source === 'custom-dataset' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 mr-1">
                  📚 Dataset
                </span>
              )}
              {message.source === 'gemini' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 mr-1">
                  🤖 AI
                </span>
              )}
              {message.confidence && (
                <span className="text-slate-400">
                  {Math.round(message.confidence * 100)}%
                </span>
              )}
            </span>
          )}
          
          {isSpeaking && !isUser && (
            <span className="ml-1 sm:ml-2 text-purple-400">🔊</span>
          )}
        </div>
      </div>
    </div>
  );
};