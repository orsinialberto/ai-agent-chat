/**
 * Anonymous Chat Service
 * Manages anonymous chats in sessionStorage
 * These chats are temporary and will be lost on page refresh or browser close
 */

import { Chat } from './api';

const STORAGE_KEY = 'anonymous_chats';

export class AnonymousChatService {
  /**
   * Save chats to sessionStorage
   */
  static saveChats(chats: Chat[]): void {
    try {
      const serialized = JSON.stringify(chats, (key, value) => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      sessionStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Error saving anonymous chats to sessionStorage:', error);
      // sessionStorage might be full or unavailable
    }
  }

  /**
   * Get chats from sessionStorage
   */
  static getChats(): Chat[] {
    try {
      const serialized = sessionStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return [];
      }
      
      const chats = JSON.parse(serialized) as Chat[];
      // Convert ISO strings back to Date objects
      return chats.map(chat => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages?.map(msg => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        })) || []
      }));
    } catch (error) {
      console.error('Error loading anonymous chats from sessionStorage:', error);
      return [];
    }
  }

  /**
   * Clear all chats from sessionStorage
   */
  static clearChats(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing anonymous chats from sessionStorage:', error);
    }
  }

  /**
   * Add a chat to sessionStorage
   */
  static addChat(chat: Chat): void {
    const chats = this.getChats();
    // Check if chat already exists to avoid duplicates
    if (!chats.some(c => c.id === chat.id)) {
      chats.unshift(chat); // Add at the beginning
      this.saveChats(chats);
    }
  }

  /**
   * Update a chat in sessionStorage
   */
  static updateChat(chatId: string, updates: Partial<Chat>): void {
    const chats = this.getChats();
    const index = chats.findIndex(c => c.id === chatId);
    if (index !== -1) {
      chats[index] = { ...chats[index], ...updates };
      this.saveChats(chats);
    }
  }

  /**
   * Delete a chat from sessionStorage
   */
  static deleteChat(chatId: string): void {
    const chats = this.getChats();
    const filtered = chats.filter(c => c.id !== chatId);
    this.saveChats(filtered);
  }

  /**
   * Get a specific chat by ID
   */
  static getChat(chatId: string): Chat | null {
    const chats = this.getChats();
    return chats.find(c => c.id === chatId) || null;
  }
}

