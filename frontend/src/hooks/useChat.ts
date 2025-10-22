import { useState, useCallback } from 'react';
import { apiService, Chat, Message, CreateChatRequest, CreateMessageRequest } from '../services/api';

export interface UseChatReturn {
  // State
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createChat: (request: CreateChatRequest) => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = useCallback(async (request: CreateChatRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createChat(request);
      
      if (response.success && response.data) {
        setCurrentChat(response.data);
        setMessages(response.data.messages || []);
      } else {
        setError(response.error || 'Failed to create chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentChat || !content.trim()) return;
    
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      chatId: currentChat.id,
      role: 'user',
      content: content.trim(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const request: CreateMessageRequest = {
        chatId: currentChat.id,
        content: content.trim(),
        role: 'user'
      };

      const response = await apiService.sendMessage(currentChat.id, request);
      
      if (response.success && response.data) {
        // Replace temp message with real user message and add AI response
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== userMessage.id);
          return [...filtered, userMessage, response.data!];
        });
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        setError(response.error || 'Failed to send message');
      }
    } catch (err) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [currentChat]);

  const loadChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getChat(chatId);
      
      if (response.success && response.data) {
        setCurrentChat(response.data);
        setMessages(response.data.messages || []);
      } else {
        setError(response.error || 'Failed to load chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentChat,
    messages,
    isLoading,
    error,
    createChat,
    loadChat,
    sendMessage,
    clearError
  };
};
