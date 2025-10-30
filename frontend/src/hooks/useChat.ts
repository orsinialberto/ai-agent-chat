import { useState, useCallback } from 'react';
import { apiService, Chat, Message, CreateChatRequest, CreateMessageRequest, ApiResponse } from '../services/api';
import { t } from '../utils/i18n';

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

/**
 * Convert API error response to localized error message
 */
function getErrorMessage(response: ApiResponse<any>, context: 'send' | 'load' | 'create'): string {
  // Handle specific error types
  if (response.errorType === 'LLM_UNAVAILABLE') {
    return context === 'create' 
      ? t('errors.llm_unavailable_on_create')
      : t('errors.llm_unavailable');
  }
  
  if (response.error === 'NETWORK_ERROR') {
    return t('errors.network_error');
  }
  
  // Use backend message if available, otherwise use localized defaults
  if (response.message) {
    return response.message;
  }
  
  // Fallback to context-specific errors
  switch (context) {
    case 'send':
    case 'create':
      return t('errors.failed_to_send');
    case 'load':
      return t('errors.failed_to_load');
    default:
      return t('errors.unknown_error');
  }
}

export const useChat = (): UseChatReturn => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = useCallback(async (request: CreateChatRequest) => {
    setIsLoading(true);
    setError(null);
    
    // Add user message immediately if initialMessage is provided
    let tempUserMessage: Message | null = null;
    if (request.initialMessage) {
      tempUserMessage = {
        id: `temp_${Date.now()}`,
        chatId: '', // Will be updated when chat is created
        role: 'user',
        content: request.initialMessage.trim(),
        createdAt: new Date()
      };
      setMessages([tempUserMessage]);
    }
    
    try {
      const response = await apiService.createChat(request);
      
      if (response.success && response.data) {
        setCurrentChat(response.data);
        // Replace temp message with real messages from server
        setMessages(response.data.messages || []);
      } else {
        // Remove temp message on error
        if (tempUserMessage) {
          setMessages([]);
        }
        
        // If chat was created but LLM failed, still set the chat
        if (response.chatId) {
          // Load the created chat
          const chatResponse = await apiService.getChat(response.chatId);
          if (chatResponse.success && chatResponse.data) {
            setCurrentChat(chatResponse.data);
            setMessages(chatResponse.data.messages || []);
          }
        }
        
        // Show localized error message
        setError(getErrorMessage(response, 'create'));
      }
    } catch (err) {
      // Remove temp message on error
      if (tempUserMessage) {
        setMessages([]);
      }
      setError(t('errors.unknown_error'));
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
        
        // Show localized error message
        setError(getErrorMessage(response, 'send'));
      }
    } catch (err) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setError(t('errors.unknown_error'));
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
        // Show localized error message
        setError(getErrorMessage(response, 'load'));
      }
    } catch (err) {
      setError(t('errors.unknown_error'));
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
