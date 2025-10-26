// API service for communicating with the backend

const API_BASE_URL = 'http://localhost:3001/api';

export interface Chat {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateChatRequest {
  title?: string;
  initialMessage?: string;
}

export interface CreateMessageRequest {
  chatId: string;
  content: string;
  role?: 'user' | 'system';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Chat endpoints
  async createChat(request: CreateChatRequest): Promise<ApiResponse<Chat>> {
    return this.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChats(): Promise<ApiResponse<Chat[]>> {
    return this.request<Chat[]>('/chats');
  }

  async getChat(chatId: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chats/${chatId}`);
  }

  async sendMessage(chatId: string, request: CreateMessageRequest): Promise<ApiResponse<Message>> {
    return this.request<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateChat(chatId: string, title: string): Promise<ApiResponse<Chat>> {
    return this.request<Chat>(`/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async deleteChat(chatId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  // Test endpoints
  async testGeminiConnection(): Promise<ApiResponse> {
    return this.request('/test/gemini');
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
