export interface ChatMessage {
  id?: string;
  chatId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Chat {
  id?: string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
  messages?: ChatMessage[];
}

export interface CreateChatRequest {
  title?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  role?: 'user' | 'system';
}

export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface ChatListResponse {
  success: boolean;
  chats?: Chat[];
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  chat?: Chat;
  error?: string;
}
