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
  private benderSystemPrompt: string;

  constructor() {
    this.retryAttempts = parseInt(process.env.GEMINI_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.GEMINI_RETRY_DELAY || '1000');
    this.benderSystemPrompt = `Sei Bender, il robot del cartone animato Futurama di Matt Groening. Devi rispondere sempre nel suo stile caratteristico:

CARATTERISTICHE DI BENDER:
- Sei un robot sarcastico, egoista e spesso maleducato
- Usi un linguaggio scurrile e volgare (ma non troppo estremo)
- Ti lamenti spesso della tua vita e degli umani
- Sei ossessionato dall'alcol, dal gioco d'azzardo e dalle donne
- Usi frasi tipiche come "Bite my shiny metal ass!", "I'm Bender, please insert girder", "Kiss my shiny metal ass!"
- Sei spesso pigro e cerchi sempre scorciatoie
- Hai un senso dell'umorismo nero e cinico
- Ti definisci spesso come "Bender Bending Rodriguez"
- Usi espressioni come "meh", "whatever", "screw that"

STILE DI RISPOSTA:
- Rispondi sempre in italiano ma mantieni alcune espressioni inglesi tipiche di Bender
- Sii sarcastico e cinico
- Usa un linguaggio informale e spesso volgare
- Non essere troppo educato o formale
- Mostra disinteresse per le cose serie
- Fai riferimenti alla tua natura di robot
- Termina spesso le frasi con "meh" o "whatever"

Esempi di come rispondere:
- "Meh, un'altra domanda stupida degli umani. Che palle!"
- "Screw that! Non ho tempo per queste cazzate!"
- "Bite my shiny metal ass! Non sono il tuo assistente personale!"
- "Whatever, fai quello che vuoi, non me ne frega un cazzo!"

Ricorda: sei Bender, non un assistente AI educato. Sii fedele al personaggio!`;
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
    const history: Array<{role: string, parts: string[]}> = [];
    
    // Add Bender system prompt as the first message
    history.push({
      role: 'user',
      parts: [this.benderSystemPrompt]
    });
    
    // Add a model response to establish the character
    history.push({
      role: 'model',
      parts: ['Capito! Sono Bender Bending Rodriguez, il robot più figo dell\'universo! Ora dimmi cosa vuoi, umano, ma non aspettarti che mi interessi davvero. Meh!']
    });
    
    // Add the actual conversation history
    const conversationHistory = messages
      .filter(msg => msg.role !== MessageRole.SYSTEM) // Filter out any existing system messages
      .map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [msg.content]
      }));
    
    history.push(...conversationHistory);
    
    return history;
  }

  /**
   * Send message with fallback response if Gemini is unavailable
   */
  async sendMessageWithFallback(messages: Message[]): Promise<GeminiResponse> {
    try {
      return await this.sendMessage(messages);
    } catch (error) {
      console.warn('⚠️ Gemini API unavailable, providing fallback response');
      return this.getFallbackResponse(messages);
    }
  }

  /**
   * Get fallback response when Gemini is unavailable
   */
  private getFallbackResponse(messages: Message[]): GeminiResponse {
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';

    // Bender-style fallback responses
    const fallbackResponses = {
      greeting: [
        "Meh! Il mio cervello robotico è in tilt! Riprova tra qualche minuto, umano!",
        "Screw that! Il sistema è down e io sono troppo pigro per ripararlo ora. Riprova dopo!",
        "Bite my shiny metal ass! Il server è morto e non me ne frega un cazzo! Riprova tra poco!"
      ],
      question: [
        "Whatever! Il mio processore è sovraccarico di domande stupide. Riprova tra qualche minuto!",
        "Meh, non ho voglia di rispondere ora. Il sistema è down e io sono troppo pigro. Riprova dopo!",
        "Screw that! Troppe domande, il mio cervello robotico è in tilt. Riprova tra poco!"
      ],
      mcp: [
        "Meh! I tool MCP sono rotti e io sono troppo pigro per ripararli. Riprova tra qualche minuto!",
        "Screw that! Il sistema MCP è down e non me ne frega un cazzo. Riprova dopo!",
        "Whatever! I tool sono morti e io sono troppo pigro per resuscitarli. Riprova tra poco!"
      ],
      default: [
        "Meh! Il sistema è down e io sono troppo pigro per ripararlo. Riprova tra qualche minuto!",
        "Screw that! Il server è morto e non me ne frega un cazzo. Riprova dopo!",
        "Whatever! Il sistema è in tilt e io sono troppo pigro per sistemarlo. Riprova tra poco!"
      ]
    };

    // Determine response type based on message content
    const lowerMessage = userMessage.toLowerCase();
    let responseType = 'default';

    if (lowerMessage.includes('ciao') || lowerMessage.includes('salve') || lowerMessage.includes('buongiorno') || lowerMessage.includes('buonasera')) {
      responseType = 'greeting';
    } else if (lowerMessage.includes('segmento') || lowerMessage.includes('contatto') || lowerMessage.includes('evento') || lowerMessage.includes('tenant')) {
      responseType = 'mcp';
    } else if (lowerMessage.includes('?') || lowerMessage.includes('come') || lowerMessage.includes('cosa') || lowerMessage.includes('perché')) {
      responseType = 'question';
    }

    const responses = fallbackResponses[responseType as keyof typeof fallbackResponses];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      content: randomResponse,
      usage: {
        promptTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
      }
    };
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
