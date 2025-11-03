// Shared types between frontend and backend

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
  role: MessageRole;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LLMProvider {
  id: string;
  name: string;
  type: LLMType;
  config: Record<string, any>;
  active: boolean;
  createdAt: Date;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum LLMType {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MCP = 'mcp'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: string;
  message?: string;
  retryAfter?: number;
  chatId?: string;
}

export interface CreateChatRequest {
  title?: string;
  initialMessage?: string;
  model?: string;
}

export interface CreateMessageRequest {
  chatId: string;
  content: string;
  role: MessageRole;
  model?: string;
}

export interface ChatResponse {
  chat: Chat;
  messages: Message[];
}

// Authentication types
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// Extend Express Request type for authentication
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        oauthToken?: string; // opzionale, presente solo se MCP è abilitato
      };
    }
  }
}
