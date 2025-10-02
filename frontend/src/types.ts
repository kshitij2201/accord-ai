export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  detectedLanguage?: string;
  source?: string;
  confidence?: number;
  category?: string;
}

export interface ApiMessage {
  role: 'accord-user' | 'accord-assistant';
  content: string;
}

export interface ApiRequest {
  model: string;
  messages: ApiMessage[];
}

export interface ApiResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  tokens_used: number;
}