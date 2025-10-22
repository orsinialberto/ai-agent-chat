import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { 
  Chat, 
  Message, 
  MessageRole, 
  CreateChatRequest, 
  CreateMessageRequest,
  ApiResponse
} from '../types/shared';

export class ChatController {
  /**
   * Create a new chat
   */
  async createChat(req: Request<{}, ApiResponse<Chat>, CreateChatRequest>, res: Response<ApiResponse<Chat>>) {
    try {
      const { title, initialMessage } = req.body;

      // Create chat in database
      const chat = await databaseService.createChat(title);

      // If there's an initial message, process it
      if (initialMessage) {
        // Add user message to database
        const userMessage = await databaseService.addMessage(
          chat.id,
          MessageRole.USER,
          initialMessage
        );

        // Get AI response
        try {
          const aiResponse = await geminiService.sendMessage([userMessage]);
          
          // Add AI response to database
          const assistantMessage = await databaseService.addMessage(
            chat.id,
            MessageRole.ASSISTANT,
            aiResponse.content
          );

          // Get updated chat with messages
          const updatedChat = await databaseService.getChat(chat.id);
          if (updatedChat) {
            res.status(201).json({
              success: true,
              data: updatedChat
            });
            return;
          }
        } catch (error) {
          console.error('Error getting AI response:', error);
          // Continue with just the user message
        }
      }

      res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat'
      });
    }
  }

  /**
   * Send a message to an existing chat
   */
  async sendMessage(req: Request<{ chatId: string }, ApiResponse<Message>, CreateMessageRequest>, res: Response<ApiResponse<Message>>) {
    try {
      const { chatId } = req.params;
      const { content, role = MessageRole.USER } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      // Check if chat exists
      const chat = await databaseService.getChat(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Add user message to database
      const userMessage = await databaseService.addMessage(
        chatId,
        role,
        content.trim()
      );

      try {
        // Get chat history for context
        const chatHistory = await databaseService.getMessages(chatId);
        
        // Get AI response
        const aiResponse = await geminiService.sendMessage(chatHistory);
        
        // Add AI response to database
        const assistantMessage = await databaseService.addMessage(
          chatId,
          MessageRole.ASSISTANT,
          aiResponse.content
        );

        res.json({
          success: true,
          data: assistantMessage
        });
      } catch (error) {
        console.error('Error getting AI response:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get AI response'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Get all chats
   */
  async getChats(req: Request, res: Response<ApiResponse<Chat[]>>) {
    try {
      const chats = await databaseService.getChats();
      res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error getting chats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chats'
      });
    }
  }

  /**
   * Get a specific chat by ID
   */
  async getChat(req: Request<{ chatId: string }>, res: Response<ApiResponse<Chat>>) {
    try {
      const { chatId } = req.params;
      const chat = await databaseService.getChat(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error getting chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chat'
      });
    }
  }

  /**
   * Test Gemini connection
   */
  async testConnection(req: Request, res: Response) {
    try {
      const isConnected = await geminiService.testConnection();
      
      res.json({
        success: isConnected,
        message: isConnected ? 'Gemini API connection successful' : 'Gemini API connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test connection'
      });
    }
  }

  /**
   * Update chat title
   */
  async updateChat(req: Request<{ chatId: string }, ApiResponse<Chat>, { title: string }>, res: Response<ApiResponse<Chat>>) {
    try {
      const { chatId } = req.params;
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title is required'
        });
      }

      // Check if chat exists
      const existingChat = await databaseService.getChat(chatId);
      if (!existingChat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Update chat title
      await databaseService.updateChatTitle(chatId, title.trim());

      // Get updated chat
      const updatedChat = await databaseService.getChat(chatId);
      if (!updatedChat) {
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve updated chat'
        });
      }

      res.json({
        success: true,
        data: updatedChat
      });
    } catch (error) {
      console.error('Error updating chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update chat'
      });
    }
  }

  /**
   * Delete a chat
   */
  async deleteChat(req: Request<{ chatId: string }>, res: Response<ApiResponse<{ message: string }>>) {
    try {
      const { chatId } = req.params;

      // Check if chat exists
      const existingChat = await databaseService.getChat(chatId);
      if (!existingChat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Delete chat
      await databaseService.deleteChat(chatId);

      res.json({
        success: true,
        data: { message: 'Chat deleted successfully' }
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat'
      });
    }
  }

  /**
   * Test database connection
   */
  async testDatabase(req: Request, res: Response) {
    try {
      const isConnected = await databaseService.testConnection();
      
      res.json({
        success: isConnected,
        message: isConnected ? 'Database connection successful' : 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing database connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test database connection'
      });
    }
  }
}

// Export singleton instance
export const chatController = new ChatController();
