import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, MessageRole } from '../types/shared';

export interface GeminiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.retryAttempts = parseInt(process.env.GEMINI_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.GEMINI_RETRY_DELAY || '1000');
  }

  private initialize() {
    if (this.genAI && this.model) {
      return; // Already initialized
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }

  /**
   * Send a message to Gemini and get a response with retry logic
   */
  async sendMessage(messages: Message[]): Promise<GeminiResponse> {
    return await this.sendMessageWithRetry(messages, 0);
  }

  /**
   * Send message with retry logic and exponential backoff
   */
  private async sendMessageWithRetry(messages: Message[], attempt: number): Promise<GeminiResponse> {
    try {
      // Initialize if not already done
      this.initialize();
      
      // Convert messages to Gemini format
      const history = this.convertMessagesToHistory(messages);
      
      // Start a chat session
      const chat = this.model.startChat({
        history: history,
      });

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== MessageRole.USER) {
        throw new Error('Last message must be from user');
      }

      // Send message and get response
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        usage: {
          promptTokens: 0, // Gemini doesn't provide detailed token usage in this API
          responseTokens: 0,
          totalTokens: 0,
        }
      };
    } catch (error) {
      const isRetryableError = this.isRetryableError(error);
      
      if (isRetryableError && attempt < this.retryAttempts) {
        const delay = this.calculateRetryDelay(attempt);
        console.warn(`🔄 Gemini API error (attempt ${attempt + 1}/${this.retryAttempts}): ${error instanceof Error ? error.message : 'Unknown error'}. Retrying in ${delay}ms...`);
        
        await this.delay(delay);
        return await this.sendMessageWithRetry(messages, attempt + 1);
      }
      
      // If not retryable or max attempts reached, throw error
      console.error('❌ Gemini API error (final):', error);
      throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    // Check for specific retryable error conditions
    const retryablePatterns = [
      '503 Service Unavailable',
      'The model is overloaded',
      'Rate limit exceeded',
      'Quota exceeded',
      'Internal server error',
      'Bad Gateway',
      'Gateway Timeout',
      'Service Unavailable',
      'Too Many Requests'
    ];
    
    return retryablePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (2^attempt) + jitter
    const exponentialDelay = this.retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convert chat messages to Gemini history format
   */
  private convertMessagesToHistory(messages: Message[]): Array<{role: string, parts: string[]}> {
    return messages
      .filter(msg => msg.role !== MessageRole.SYSTEM) // Gemini doesn't support system messages in history
      .map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [msg.content]
      }));
  }

  /**
   * Send message - removed fallback, errors are now propagated to controller
   * The controller will handle errors and return appropriate HTTP status codes
   */
  async sendMessageWithFallback(messages: Message[]): Promise<GeminiResponse> {
    // Simply call sendMessage - it has retry logic built-in
    // If it fails after all retries, let the error propagate to the controller
    return await this.sendMessage(messages);
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Initialize if not already done
      this.initialize();
      
      const testMessage: Message = {
        id: 'test_message',
        chatId: 'test_chat',
        role: MessageRole.USER,
        content: 'Hello, this is a test message.',
        createdAt: new Date()
      };

      await this.sendMessage([testMessage]);
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models (for future multi-model support)
   */
  getAvailableModels(): string[] {
    return ['gemini-2.5-flash', 'gemini-2.5-pro'];
  }

  /**
   * Switch model (for future multi-model support)
   */
  switchModel(modelName: string): void {
    // Initialize if not already done
    this.initialize();
    
    // Validate model name
    const availableModels = this.getAvailableModels();
    if (!availableModels.includes(modelName)) {
      throw new Error(`Model ${modelName} is not available. Available models: ${availableModels.join(', ')}`);
    }
    
    this.model = this.genAI!.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
