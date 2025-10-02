import { useState, useCallback } from 'react';
import { Message } from '../types';
import { apiService } from '../services/apiService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  const sendMessage = useCallback(async (content: string, isAnonymous: boolean = false, userToken?: string) => {
    // Rate limiting - wait at least 3 seconds between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = 3000; // 3 seconds

    if (timeSinceLastRequest < minDelay) {
      const remainingDelay = minDelay - timeSinceLastRequest;
      setError(`Please wait ${Math.ceil(remainingDelay / 1000)} seconds before sending another message.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setLastRequestTime(now);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('🔍 Sending message:', { isAnonymous, hasToken: !!userToken });

      console.log(userToken)
      
      // Make API call using the centralized service
      const data = await apiService.sendChatMessage(content, isAnonymous);
      
      if (data.success) {
        // Add assistant response
        const assistantMessage: Message = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          detectedLanguage: data.detectedLanguage,
          source: data.source,
          confidence: data.confidence,
          category: data.category
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'Chat request failed');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // If authentication failed and we're not already in anonymous mode, retry anonymously
      if (error.response?.status === 401 && !isAnonymous) {
        console.log('🔄 Authentication failed, retrying anonymously...');
        
        try {
          const retryData = await apiService.sendChatMessage(content, true);
          
          if (retryData.success) {
            const assistantMessage: Message = {
              id: Date.now().toString() + '-assistant',
              role: 'assistant',
              content: retryData.response,
              timestamp: new Date(),
              detectedLanguage: retryData.detectedLanguage,
              source: retryData.source,
              confidence: retryData.confidence,
              category: retryData.category
            };

            setMessages(prev => [...prev, assistantMessage]);
            return;
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      // Show error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorAssistantMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [lastRequestTime]);

  const sendFile = useCallback(async (file: File, customPrompt?: string, isAnonymous: boolean = false, userToken?: string) => {
    // Rate limiting - wait at least 3 seconds between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = 3000; // 3 seconds

    if (timeSinceLastRequest < minDelay) {
      const remainingDelay = minDelay - timeSinceLastRequest;
      setError(`Please wait ${Math.ceil(remainingDelay / 1000)} seconds before sending another request.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setLastRequestTime(now);

    // Add a user message indicating a file upload / optional prompt
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: customPrompt ? `${customPrompt}` : `Uploaded file: ${file.name}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const endpoint = isAnonymous ? '/ai/file-anonymous' : '/ai/file';
      const form = new FormData();
      form.append('file', file);
      if (customPrompt) form.append('prompt', customPrompt);

  const config: any = { headers: { 'Content-Type': 'multipart/form-data' } };
  if (userToken) config.headers.Authorization = `Bearer ${userToken}`;
  const data = await apiService.post(endpoint, form, config);

      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now().toString() + '-assistant',
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          detectedLanguage: data.detectedLanguage,
          source: data.source,
          confidence: data.confidence,
          category: data.category
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'File request failed');
      }
    } catch (error: any) {
      console.error('File error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process file';
      setError(errorMessage);

      const errorAssistantMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [lastRequestTime]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendFile,
    clearMessages,
    clearError
  };
};