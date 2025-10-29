import { useState, useCallback, useEffect } from 'react';
import { apiService, Chat } from '../services/api';

export interface UseSidebarReturn {
  // State
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<Chat | null>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  createNewChat: () => Promise<Chat | null>;
  addChat: (chat: Chat) => void;
  clearError: () => void;
}

export const useSidebar = (): UseSidebarReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getChats();
      
      if (response.success && response.data) {
        setChats(response.data);
      } else {
        setError(response.error || 'Failed to load chats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectChat = useCallback(async (chatId: string): Promise<Chat | null> => {
    try {
      const response = await apiService.getChat(chatId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to load chat');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      const response = await apiService.updateChat(chatId, title);
      
      if (response.success && response.data) {
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? response.data! : chat
        ));
      } else {
        setError(response.error || 'Failed to update chat title');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const response = await apiService.deleteChat(chatId);
      
      if (response.success) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
      } else {
        setError(response.error || 'Failed to delete chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    try {
      const response = await apiService.createChat({ title: 'New Chat' });
      
      if (response.success && response.data) {
        setChats(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error || 'Failed to create chat');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const addChat = useCallback((chat: Chat) => {
    setChats(prev => {
      // Check if chat already exists to avoid duplicates
      if (prev.some(c => c.id === chat.id)) {
        return prev;
      }
      // Add at the beginning of the list
      return [chat, ...prev];
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    isLoading,
    error,
    loadChats,
    selectChat,
    updateChatTitle,
    deleteChat,
    createNewChat,
    addChat,
    clearError
  };
};
