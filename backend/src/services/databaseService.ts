import { PrismaClient, Chat, Message, MessageRole as PrismaMessageRole } from '@prisma/client';
import { Chat as SharedChat, Message as SharedMessage, MessageRole } from '../types/shared';

const prisma = new PrismaClient();

export class DatabaseService {
  /**
   * Create a new chat
   */
  async createChat(userId: string, title?: string): Promise<SharedChat> {
    const chat = await prisma.chat.create({
      data: {
        userId,
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
   * Get a chat by ID and userId (for authorization)
   */
  async getChat(chatId: string, userId?: string): Promise<SharedChat | null> {
    const where: any = { id: chatId };
    if (userId) {
      where.userId = userId;
    }

    const chat = await prisma.chat.findFirst({
      where,
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
   * Get all chats for a user
   */
  async getChats(userId?: string): Promise<SharedChat[]> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const chats = await prisma.chat.findMany({
      where,
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
    // Convert shared MessageRole to Prisma MessageRole
    let prismaRole: PrismaMessageRole;
    if (role === MessageRole.USER) {
      prismaRole = PrismaMessageRole.user;
    } else if (role === MessageRole.ASSISTANT) {
      prismaRole = PrismaMessageRole.assistant;
    } else {
      prismaRole = PrismaMessageRole.system;
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        role: prismaRole,
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
    // Convert Prisma MessageRole to shared MessageRole
    let role: MessageRole;
    if (message.role === PrismaMessageRole.user) {
      role = MessageRole.USER;
    } else if (message.role === PrismaMessageRole.assistant) {
      role = MessageRole.ASSISTANT;
    } else {
      role = MessageRole.SYSTEM;
    }

    return {
      id: message.id,
      chatId: message.chatId,
      role,
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
