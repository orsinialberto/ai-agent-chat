/**
 * Authentication Service
 * Handles user registration, login, JWT generation, and OAuth token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAUTH_CONFIG, isOAuthEnabled } from '../config/oauthConfig';
import { MCP_CONFIG } from '../config/mcpConfig';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '../types/shared';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  oauthToken?: string;
  oauthTokenExpiry?: number; // Unix timestamp in seconds
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { username, email, password } = data;

    // Validation
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === email) {
        throw new Error('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

    // Generate JWT (no OAuth token on registration)
    const token = this.generateJWT({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const decodedToken = jwt.decode(token) as any;
    const expiresAt = new Date(decodedToken.exp * 1000).toISOString();

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      expiresAt
    };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { usernameOrEmail, password } = data;

    // Validation
    if (!usernameOrEmail || !password) {
      throw new Error('Username/email and password are required');
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    let oauthToken: string | undefined = undefined;
    let oauthTokenExpiry: number | undefined = undefined;

    // If MCP is enabled AND OAuth is configured, get OAuth token
    if (MCP_CONFIG.enabled && isOAuthEnabled()) {
      try {
        // Pass username and password from login request (password in plain text)
        const oauthResponse = await this.getOAuthToken(user.username, password);
        oauthToken = oauthResponse.access_token;
        // Calculate expiry timestamp (Unix timestamp in seconds)
        oauthTokenExpiry = Math.floor(Date.now() / 1000) + oauthResponse.expires_in;

        console.log(`✅ OAuth token obtained for user ${user.username}, expires at: ${new Date(oauthTokenExpiry * 1000).toISOString()}`);
      } catch (error) {
        console.error('❌ Failed to get OAuth token:', error);
        // Continue without OAuth token if it fails
        oauthToken = undefined;
        oauthTokenExpiry = undefined;
      }
    } else {
      console.log('ℹ️ MCP or OAuth not enabled, skipping OAuth token generation');
    }

    // Generate JWT with or without OAuth token and expiry
    const token = this.generateJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      oauthToken,
      oauthTokenExpiry
    });

    const decodedToken = jwt.decode(token) as any;
    const expiresAt = new Date(decodedToken.exp * 1000).toISOString();

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      expiresAt
    };
  }

  /**
   * Get OAuth token from OAuth server
   * Only called if MCP and OAuth are enabled
   * Uses query params instead of body
   * @param username - Username for OAuth authentication
   * @param password - Password in plain text (only available during login)
   */
  private async getOAuthToken(
    username: string,
    password: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const oauthServerUrl = OAUTH_CONFIG.mockServerUrl;
    const tokenEndpoint = OAUTH_CONFIG.tokenEndpoint;
    
    // Build URL with query params
    const url = new URL(`${oauthServerUrl}${tokenEndpoint}`);
    url.searchParams.append('username', username);
    url.searchParams.append('password', password);
    
    console.log(`🔐 Requesting OAuth token from: ${url.toString()}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OAUTH_CONFIG.timeout);

      // POST request with query params (no body)
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OAuth server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.access_token || !data.expires_in) {
        throw new Error('Invalid OAuth response format');
      }

      return {
        access_token: data.access_token,
        expires_in: data.expires_in
      };
    } catch (error) {
      console.error('❌ OAuth token request failed:', error);
      throw new Error(`Failed to get OAuth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate JWT token
   */
  generateJWT(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Logout user
   * OAuth token is stored in JWT, so logout is handled by JWT expiration
   * This method is kept for compatibility but doesn't need to clear DB (token is in JWT)
   */
  async logout(userId: string): Promise<void> {
    // OAuth token is in JWT, not DB, so no DB update needed
    // JWT will expire and be invalidated naturally
    console.log(`✅ User ${userId} logged out (JWT will expire naturally)`);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Password changed successfully for user ${user.username}`);
  }

  /**
   * Delete user account
   * This will cascade delete all user's chats and messages
   */
  async deleteUser(userId: string): Promise<void> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user (chats and messages will be deleted via cascade)
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`✅ User ${user.username} (${userId}) deleted successfully`);
  }
}

export const authService = new AuthService();

