import { PrismaClient, Chat, Message, MessageRole } from '@prisma/client';
import { Chat as SharedChat, Message as SharedMessage } from '../types/shared';

const prisma = new PrismaClient();

export class DatabaseService {
  /**
   * Create a new chat
   */
  async createChat(title?: string): Promise<SharedChat> {
    const chat = await prisma.chat.create({
      data: {
        title: title || 'New Chat',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return this.mapChatToShared(chat);
  }

  /**
   * Get a chat by ID
   */
  async getChat(chatId: string): Promise<SharedChat | null> {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return chat ? this.mapChatToShared(chat) : null;
  }

  /**
   * Get all chats
   */
  async getChats(): Promise<SharedChat[]> {
    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return chats.map(chat => this.mapChatToShared(chat));
  }

  /**
   * Add a message to a chat
   */
  async addMessage(chatId: string, role: MessageRole, content: string, metadata?: any): Promise<SharedMessage> {
    const message = await prisma.message.create({
      data: {
        chatId,
        role,
        content,
        metadata
      }
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return this.mapMessageToShared(message);
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string): Promise<SharedMessage[]> {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }
    });

    return messages.map(message => this.mapMessageToShared(message));
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await prisma.chat.update({
      where: { id: chatId },
      data: { title }
    });
  }

  /**
   * Delete a chat and all its messages
   */
  async deleteChat(chatId: string): Promise<void> {
    await prisma.chat.delete({
      where: { id: chatId }
    });
  }

  /**
   * Map Prisma Chat to Shared Chat
   */
  private mapChatToShared(chat: Chat & { messages: Message[] }): SharedChat {
    return {
      id: chat.id,
      title: chat.title || undefined,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map(msg => this.mapMessageToShared(msg))
    };
  }

  /**
   * Map Prisma Message to Shared Message
   */
  private mapMessageToShared(message: Message): SharedMessage {
    return {
      id: message.id,
      chatId: message.chatId,
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
      metadata: message.metadata as Record<string, any> | undefined,
      createdAt: message.createdAt
    };
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
