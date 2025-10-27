import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { MCPClient } from '../services/mcpClient';
import { MCPContextService } from '../services/mcpContextService';
import { MCP_CONFIG } from '../config/mcpConfig';
import { 
  Chat, 
  Message, 
  MessageRole, 
  CreateChatRequest, 
  CreateMessageRequest,
  ApiResponse
} from '../types/shared';

export class ChatController {
  private mcpClient?: MCPClient;
  private mcpContextService?: MCPContextService;
  private mcpEnabled: boolean;

  constructor() {
    this.mcpEnabled = MCP_CONFIG.enabled;
    
    if (this.mcpEnabled) {
      this.mcpClient = new MCPClient(MCP_CONFIG);
      this.mcpContextService = new MCPContextService(this.mcpClient, MCP_CONFIG);
      this.initializeMCP();
    }
  }

  private async initializeMCP(): Promise<void> {
    try {
      const isHealthy = await this.mcpClient!.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️ MCP Server is not healthy, disabling MCP features');
        this.mcpEnabled = false;
        return;
      }

      const initialized = await this.mcpClient!.initialize();
      if (!initialized) {
        console.warn('⚠️ Failed to initialize MCP Server, disabling MCP features');
        this.mcpEnabled = false;
        return;
      }

      console.log('✅ MCP Server initialized successfully');
    } catch (error) {
      console.error('❌ MCP initialization failed:', error);
      this.mcpEnabled = false;
    }
  }

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
        
        // Get AI response with MCP integration
        let aiResponse;
        if (this.mcpEnabled && this.mcpContextService) {
          aiResponse = await this.processWithMCPIntegration(content, chatHistory);
        } else {
          aiResponse = await geminiService.sendMessageWithFallback(chatHistory);
        }
        
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

  /**
   * Process message with MCP integration
   */
  private async processWithMCPIntegration(message: string, chatHistory: Message[]): Promise<{ content: string }> {
    try {
      // Get MCP tools context
      const mcpContext = await this.mcpContextService!.getMCPToolsContext();
      
      // Create enhanced prompt with MCP context
      const systemPrompt = `
${mcpContext}

When a user asks a question:
1. If it can be answered using MCP tools, call the appropriate tool
2. If it's a general question, answer directly
3. Always be helpful and provide clear explanations

User message: "${message}"

Respond with either:
- A direct answer if no MCP tools are needed
- A tool call in the format: TOOL_CALL:toolName:{"param1":"value1","param2":"value2"}
- If you need to call multiple tools, use multiple TOOL_CALL lines
      `.trim();

      // Get LLM response with MCP context
      const llmResponse = await geminiService.sendMessage([
        ...chatHistory,
        { role: MessageRole.USER, content: systemPrompt } as Message
      ]);
      
      // Check if LLM wants to call tools
      const toolCalls = this.extractToolCalls(llmResponse.content);
      
      if (toolCalls.length > 0) {
        return await this.executeToolCallsAndRespond(toolCalls, message, chatHistory);
      } else {
        return llmResponse;
      }

    } catch (error) {
      console.error('MCP integration failed, falling back to Gemini:', error);
      return await geminiService.sendMessageWithFallback(chatHistory);
    }
  }

  /**
   * Extract tool calls from LLM response
   * Uses brace counting to handle nested JSON structures
   */
  private extractToolCalls(response: string): Array<{toolName: string, arguments: any}> {
    const toolCalls: Array<{toolName: string, arguments: any}> = [];
    
    // Find all TOOL_CALL markers
    const toolCallMarkerRegex = /TOOL_CALL:(\w+):/g;
    let match;
    
    while ((match = toolCallMarkerRegex.exec(response)) !== null) {
      const startIndex = match.index;
      const toolName = match[1];
      
      // Find the opening brace after the colon
      const colonIndex = match.index + match[0].length;
      let jsonStart = colonIndex;
      
      // Skip whitespace
      while (jsonStart < response.length && /\s/.test(response[jsonStart])) {
        jsonStart++;
      }
      
      if (jsonStart >= response.length || response[jsonStart] !== '{') {
        console.error('Failed to parse tool call: no opening brace found');
        continue;
      }
      
      // Find matching closing brace by counting nested braces
      let braceCount = 0;
      let jsonEnd = jsonStart;
      
      for (let i = jsonStart; i < response.length; i++) {
        if (response[i] === '{') {
          braceCount++;
        } else if (response[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
      
      if (braceCount !== 0) {
        console.error('Failed to parse tool call: unmatched braces');
        continue;
      }
      
      try {
        const jsonStr = response.substring(jsonStart, jsonEnd + 1);
        const args = JSON.parse(jsonStr);
        toolCalls.push({ toolName, arguments: args });
      } catch (error) {
        console.error('Failed to parse tool call:', response.substring(startIndex, jsonEnd + 1));
        console.error('Parse error:', error);
      }
    }
    
    return toolCalls;
  }

  /**
   * Execute tool calls and generate response
   */
  private async executeToolCallsAndRespond(
    toolCalls: Array<{toolName: string, arguments: any}>, 
    originalMessage: string,
    chatHistory: Message[]
  ): Promise<{ content: string }> {
    try {
      const toolResults: string[] = [];
      
      // Execute all tool calls
      for (const toolCall of toolCalls) {
        const result = await this.mcpClient!.callTool(toolCall.toolName, toolCall.arguments);
        toolResults.push(`Tool ${toolCall.toolName}: ${result}`);
      }
      
      // Use LLM to interpret the results
      const context = toolResults.join('\n\n');
      const prompt = `
User asked: "${originalMessage}"

I called the following tools and got these results:
${context}

Please provide a helpful response based on these results.
      `.trim();
      
      return await geminiService.sendMessageWithFallback([
        ...chatHistory,
        { role: MessageRole.USER, content: prompt } as Message
      ]);
      
    } catch (error: any) {
      console.error('Tool execution failed:', error);
      return { content: `I encountered an error while processing your request: ${error.message}` };
    }
  }

  /**
   * Get MCP status
   */
  async getMCPStatus(req: Request, res: Response) {
    try {
      if (!this.mcpEnabled || !this.mcpContextService) {
        return res.json({
          success: false,
          message: 'MCP is not enabled',
          mcpEnabled: false
        });
      }

      const status = await this.mcpContextService.getMCPStatus();
      
      res.json({
        success: true,
        data: status,
        mcpEnabled: this.mcpEnabled
      });
    } catch (error) {
      console.error('Error getting MCP status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get MCP status'
      });
    }
  }

  /**
   * Test Gemini error handling and retry logic
   */
  async testGeminiErrorHandling(req: Request, res: Response) {
    try {
      const testMessage: Message = {
        id: 'test_error_handling',
        chatId: 'test_chat',
        role: MessageRole.USER,
        content: 'Test message for error handling',
        createdAt: new Date()
      };

      // Test with fallback
      const response = await geminiService.sendMessageWithFallback([testMessage]);
      
      res.json({
        success: true,
        message: 'Gemini error handling test completed',
        response: response.content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing Gemini error handling:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test Gemini error handling'
      });
    }
  }
}

// Export singleton instance
export const chatController = new ChatController();
