import { useState, useCallback, useEffect } from 'react';
import { apiService, Chat } from '../services/api';
import { AnonymousChatService } from '../services/anonymousChatService';

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

export interface UseSidebarOptions {
  isAnonymous?: boolean;
}

export const useSidebar = (options: UseSidebarOptions = {}): UseSidebarReturn => {
  const { isAnonymous = false } = options;
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAnonymous) {
        // Load from sessionStorage for anonymous chats
        const anonymousChats = AnonymousChatService.getChats();
        setChats(anonymousChats);
      } else {
        // Load from API for authenticated chats
        const response = await apiService.getChats();
        
        if (response.success && response.data) {
          setChats(response.data);
        } else {
          setError(response.error || 'Failed to load chats');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isAnonymous]);

  const selectChat = useCallback(async (chatId: string): Promise<Chat | null> => {
    try {
      if (isAnonymous) {
        // Load from sessionStorage for anonymous chats
        const chat = AnonymousChatService.getChat(chatId);
        if (chat) {
          return chat;
        } else {
          setError('Chat not found');
          return null;
        }
      } else {
        // Load from API for authenticated chats
        const response = await apiService.getChat(chatId);
        
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Failed to load chat');
          return null;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [isAnonymous]);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      if (isAnonymous) {
        // Update in sessionStorage for anonymous chats
        AnonymousChatService.updateChat(chatId, { title });
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, title } : chat
        ));
      } else {
        // Update via API for authenticated chats
        const response = await apiService.updateChat(chatId, title);
        
        if (response.success && response.data) {
          setChats(prev => prev.map(chat => 
            chat.id === chatId ? response.data! : chat
          ));
        } else {
          setError(response.error || 'Failed to update chat title');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [isAnonymous]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      if (isAnonymous) {
        // Delete from sessionStorage for anonymous chats
        AnonymousChatService.deleteChat(chatId);
        setChats(prev => prev.filter(chat => chat.id !== chatId));
      } else {
        // Delete via API for authenticated chats
        const response = await apiService.deleteChat(chatId);
        
        if (response.success) {
          setChats(prev => prev.filter(chat => chat.id !== chatId));
        } else {
          setError(response.error || 'Failed to delete chat');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [isAnonymous]);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    try {
      if (isAnonymous) {
        // For anonymous chats, don't create a chat yet
        // The chat will be created when the user sends the first message
        // Return null to indicate no chat was created
        return null;
      } else {
        // Create via API for authenticated chats
        const response = await apiService.createChat({ title: 'New Chat' });
        
        if (response.success && response.data) {
          setChats(prev => [response.data!, ...prev]);
          return response.data;
        } else {
          setError(response.error || 'Failed to create chat');
          return null;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [isAnonymous]);

  const addChat = useCallback((chat: Chat) => {
    setChats(prev => {
      // Check if chat already exists to avoid duplicates
      if (prev.some(c => c.id === chat.id)) {
        return prev;
      }
      // Add at the beginning of the list
      return [chat, ...prev];
    });
    
    // Also save to sessionStorage if anonymous
    if (isAnonymous) {
      AnonymousChatService.addChat(chat);
    }
  }, [isAnonymous]);

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
