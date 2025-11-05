// API service for communicating with the backend

import { authService } from './authService';

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
  model?: string;
}

export interface CreateMessageRequest {
  chatId: string;
  content: string;
  role?: 'user' | 'system';
  model?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: string;
  message?: string;
  retryAfter?: number;
  chatId?: string;
}

// Auth types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
      // Check if token is expired before making request (JWT or OAuth)
      if (authService.hasToken() && authService.isTokenExpired()) {
        // Check if it's OAuth token expiration before removing token
        const payload = authService.decodeToken();
        const isOAuthExpired = payload?.oauthTokenExpiry && 
          Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry;
        
        console.log(isOAuthExpired ? 'OAuth token expired, logging out' : 'Token expired (JWT), logging out');
        authService.removeToken();
        
        // Redirect to login page with appropriate error
        const errorParam = isOAuthExpired ? '?error=oauth_expired' : '';
        window.location.href = `/login${errorParam}`;
        return {
          success: false,
          error: isOAuthExpired ? 'OAUTH_TOKEN_EXPIRED' : 'TOKEN_EXPIRED',
          message: isOAuthExpired 
            ? 'OAuth token has expired. Please log in again.'
            : 'Your session has expired. Please log in again.'
        };
      }

      // Get token and add to headers if available
      const token = authService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Parse response body
      const data = await response.json();

      // Handle 401 Unauthorized (token invalid or expired)
      if (response.status === 401) {
        // Handle OAuth token expiration specifically
        if (data.error === 'OAUTH_TOKEN_EXPIRED') {
          console.log('OAuth token expired, logging out');
          authService.removeToken();
          // Redirect to login page with error message
          window.location.href = '/login?error=oauth_expired';
          return {
            success: false,
            error: 'OAUTH_TOKEN_EXPIRED',
            message: data.message || 'OAuth token has expired. Please log in again.'
          };
        }
        
        console.log('Unauthorized, logging out');
        authService.removeToken();
        // Redirect to login page
        window.location.href = '/login';
        return {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in.'
        };
      }

      // If response is not OK, preserve error details from backend
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          errorType: data.errorType,
          message: data.message,
          retryAfter: data.retryAfter,
          chatId: data.chatId
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Network error or JSON parse error
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
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

  // Auth endpoints
  async register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/account', {
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
