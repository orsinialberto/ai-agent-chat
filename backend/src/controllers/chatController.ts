import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { MCPClient } from '../services/mcpClient';
import { MCPContextService } from '../services/mcpContextService';
import { MCP_CONFIG } from '../config/mcpConfig';
import { isOAuthEnabled } from '../config/oauthConfig';
import { 
  Chat, 
  Message, 
  MessageRole, 
  CreateChatRequest, 
  CreateMessageRequest,
  ApiResponse
} from '../types/shared';

export class ChatController {
  private mcpEnabled: boolean;

  constructor() {
    // Disable MCP during tests to avoid async side effects in Jest
    this.mcpEnabled = MCP_CONFIG.enabled && process.env.NODE_ENV !== 'test';
  }

  /**
   * Create MCP client with OAuth token from request
   * This is called per-request to include the user's OAuth token
   * Only includes token if OAuth is enabled
   */
  private createMCPClient(oauthToken?: string): MCPClient | null {
    if (!this.mcpEnabled) {
      return null;
    }
    // Only pass token if OAuth is configured
    const tokenToUse = isOAuthEnabled() ? oauthToken : undefined;
    return new MCPClient(MCP_CONFIG, tokenToUse);
  }

  /**
   * Create MCP context service with OAuth token
   * Only includes token if OAuth is enabled
   */
  private createMCPContextService(oauthToken?: string): MCPContextService | null {
    if (!this.mcpEnabled) {
      return null;
    }
    // Only pass token if OAuth is configured
    const tokenToUse = isOAuthEnabled() ? oauthToken : undefined;
    const mcpClient = this.createMCPClient(tokenToUse);
    if (!mcpClient) {
      return null;
    }
    return new MCPContextService(mcpClient, MCP_CONFIG);
  }

  /**
   * Create a new chat
   */
  async createChat(req: Request<{}, ApiResponse<Chat>, CreateChatRequest>, res: Response<ApiResponse<Chat>>) {
    try {
      const { title, initialMessage, model } = req.body;
      
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      // Create chat in database with userId
      const chat = await databaseService.createChat(req.user.userId, title);

      // If there's an initial message, process it
      if (initialMessage) {
        // Switch model if requested
        if (model) {
          try {
            geminiService.switchModel(model);
          } catch (e: any) {
            return res.status(400).json({
              success: false,
              error: 'INVALID_MODEL',
              message: e?.message || 'Invalid model'
            });
          }
        }
        // Add user message to database
        const userMessage = await databaseService.addMessage(
          chat.id,
          MessageRole.USER,
          initialMessage
        );

        // Get AI response
        try {
          const aiResponse = await geminiService.sendMessageWithFallback([userMessage]);
          
          // Add AI response to database
          const assistantMessage = await databaseService.addMessage(
            chat.id,
            MessageRole.ASSISTANT,
            aiResponse.content
          );

          // Get updated chat with messages
          const updatedChat = await databaseService.getChat(chat.id);
          if (updatedChat) {
            return res.status(201).json({
              success: true,
              data: updatedChat
            });
          }
        } catch (error) {
          console.error('Error getting AI response:', error);
          
          // Return error to frontend with specific error type and chatId
          return res.status(503).json({
            success: false,
            error: 'AI_SERVICE_UNAVAILABLE',
            errorType: 'LLM_UNAVAILABLE',
            message: 'The AI service is temporarily unavailable. The chat was created but the AI could not respond.',
            chatId: chat.id
          });
        }
      }

      return res.status(201).json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({
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
      const { content, role = MessageRole.USER, model } = req.body;

      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      // Check if chat exists and belongs to user
      const chat = await databaseService.getChat(chatId, req.user.userId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Switch model if requested
      if (model) {
        try {
          geminiService.switchModel(model);
        } catch (e: any) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_MODEL',
            message: e?.message || 'Invalid model'
          });
        }
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
        if (this.mcpEnabled) {
          // Create MCP context service with user's OAuth token
          const mcpContextService = this.createMCPContextService(req.user.oauthToken);
          if (mcpContextService) {
            aiResponse = await this.processWithMCPIntegration(content, chatHistory, mcpContextService);
          } else {
            aiResponse = await geminiService.sendMessageWithFallback(chatHistory);
          }
        } else {
          aiResponse = await geminiService.sendMessageWithFallback(chatHistory);
        }
        
        // Add AI response to database
        const assistantMessage = await databaseService.addMessage(
          chatId,
          MessageRole.ASSISTANT,
          aiResponse.content
        );

        return res.json({
          success: true,
          data: assistantMessage
        });
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Return specific error code for LLM unavailability
        // The frontend can handle this error type appropriately
        return res.status(503).json({
          success: false,
          error: 'AI_SERVICE_UNAVAILABLE',
          errorType: 'LLM_UNAVAILABLE',
          message: 'The AI service is temporarily unavailable. Please try again in a few moments.',
          retryAfter: 60 // Suggest retry after 60 seconds
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({
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
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const chats = await databaseService.getChats(req.user.userId);
      return res.json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error getting chats:', error);
      return res.status(500).json({
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
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { chatId } = req.params;
      const chat = await databaseService.getChat(chatId, req.user.userId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      return res.json({
        success: true,
        data: chat
      });
    } catch (error) {
      console.error('Error getting chat:', error);
      return res.status(500).json({
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
      
      return res.json({
        success: isConnected,
        message: isConnected ? 'Gemini API connection successful' : 'Gemini API connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      return res.status(500).json({
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
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { chatId } = req.params;
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title is required'
        });
      }

      // Check if chat exists and belongs to user
      const existingChat = await databaseService.getChat(chatId, req.user.userId);
      if (!existingChat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Update chat title
      await databaseService.updateChatTitle(chatId, title.trim());

      // Get updated chat
      const updatedChat = await databaseService.getChat(chatId, req.user.userId);
      if (!updatedChat) {
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve updated chat'
        });
      }

      return res.json({
        success: true,
        data: updatedChat
      });
    } catch (error) {
      console.error('Error updating chat:', error);
      return res.status(500).json({
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
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      const { chatId } = req.params;

      // Check if chat exists and belongs to user
      const existingChat = await databaseService.getChat(chatId, req.user.userId);
      if (!existingChat) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found'
        });
      }

      // Delete chat
      await databaseService.deleteChat(chatId);

      return res.json({
        success: true,
        data: { message: 'Chat deleted successfully' }
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      return res.status(500).json({
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
      
      return res.json({
        success: isConnected,
        message: isConnected ? 'Database connection successful' : 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing database connection:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to test database connection'
      });
    }
  }

  /**
   * Process message with MCP integration
   */
  private async processWithMCPIntegration(message: string, chatHistory: Message[], mcpContextService: MCPContextService): Promise<{ content: string }> {
    try {
      // Get MCP tools context
      const mcpContext = await mcpContextService.getMCPToolsContext();
      
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
        const mcpClient = mcpContextService.getMCPClient();
        return await this.executeToolCallsAndRespond(toolCalls, message, chatHistory, mcpClient, mcpContextService, 0);
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
   * Execute tool calls and generate response with automatic error recovery
   */
  private async executeToolCallsAndRespond(
    toolCalls: Array<{toolName: string, arguments: any}>, 
    originalMessage: string,
    chatHistory: Message[],
    mcpClient: MCPClient,
    mcpContextService: MCPContextService,
    retryCount: number = 0
  ): Promise<{ content: string }> {
    const MAX_RETRIES = 2;
    
    try {
      const toolResults: string[] = [];
      
      // Execute all tool calls
      for (const toolCall of toolCalls) {
        const result = await mcpClient.callTool(toolCall.toolName, toolCall.arguments);
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
      console.error(`Tool execution failed (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // If we haven't exceeded max retries, try to auto-fix with LLM
      if (retryCount < MAX_RETRIES) {
        return await this.retryWithLLMCorrection(toolCalls, originalMessage, chatHistory, mcpClient, mcpContextService, error, retryCount);
      }
      
      // Max retries exceeded, throw error to be handled by controller
      throw new Error('MCP tool execution failed after maximum retry attempts');
    }
  }

  /**
   * Use LLM to analyze error and auto-correct the tool call
   */
  private async retryWithLLMCorrection(
    toolCalls: Array<{toolName: string, arguments: any}>, 
    originalMessage: string,
    chatHistory: Message[],
    mcpClient: MCPClient,
    mcpContextService: MCPContextService,
    error: any,
    retryCount: number
  ): Promise<{ content: string }> {
    console.log(`🤖 Attempting auto-correction with LLM (attempt ${retryCount + 1})`);
    
    try {
      // Get MCP tools context for LLM to know what's available
      const mcpContext = await mcpContextService.getMCPToolsContext();
      
      // Create prompt to let LLM analyze the error and fix it
      const correctionPrompt = `
${mcpContext}

The user asked: "${originalMessage}"

I tried to call the tool "${toolCalls[0].toolName}" with these arguments:
${JSON.stringify(toolCalls[0].arguments, null, 2)}

But it failed with this error: "${error.message}"

Please analyze this error and provide a CORRECTED tool call with fixed arguments.
- Read the error message carefully to understand what's wrong
- Check available operators, attributes, and formats from the MCP tools documentation above
- Fix any invalid operators, attributes, or data formats
- Provide the corrected arguments in the same TOOL_CALL format

If you believe the error cannot be fixed with the available information, respond with ERROR_UNABLE_TO_FIX and explain why.

CORRECTED TOOL_CALL format:
TOOL_CALL:toolName:{"corrected":"arguments"}
      `.trim();

      // Ask LLM to analyze and correct
      const llmCorrection = await geminiService.sendMessageWithFallback([
        ...chatHistory,
        { role: MessageRole.USER, content: correctionPrompt } as Message
      ]);

      // Check if LLM gave up
      if (llmCorrection.content.includes('ERROR_UNABLE_TO_FIX')) {
        console.log('❌ LLM unable to fix the error');
        throw new Error('LLM was unable to correct the MCP tool call arguments');
      }

      // Extract corrected tool call
      const correctedToolCalls = this.extractToolCalls(llmCorrection.content);
      
      if (correctedToolCalls.length === 0) {
        console.log('❌ LLM did not provide a corrected tool call');
        throw new Error('LLM did not provide a corrected tool call');
      }

      console.log(`✅ LLM provided corrected tool call:`, correctedToolCalls[0]);
      
      // Retry with corrected arguments
      return await this.executeToolCallsAndRespond(
        correctedToolCalls,
        originalMessage,
        chatHistory,
        mcpClient,
        mcpContextService,
        retryCount + 1
      );

    } catch (correctionError: any) {
      console.error('Error during LLM correction:', correctionError);
      throw new Error('Error occurred during LLM error correction attempt');
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
      
      return res.json({
        success: true,
        data: status,
        mcpEnabled: this.mcpEnabled
      });
    } catch (error) {
      console.error('Error getting MCP status:', error);
      return res.status(500).json({
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
      
      return res.json({
        success: true,
        message: 'Gemini error handling test completed',
        response: response.content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing Gemini error handling:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to test Gemini error handling'
      });
    }
  }
}

// Export singleton instance
export const chatController = new ChatController();
