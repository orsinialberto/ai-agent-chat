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

    // Create user (no OAuth token on registration)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        oauthToken: null,
        tokenExpiry: null
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
    let tokenExpiry: Date | null = null;

    // If MCP is enabled AND OAuth is configured, get OAuth token
    if (MCP_CONFIG.enabled && isOAuthEnabled()) {
      try {
        const oauthResponse = await this.getOAuthToken(user);
        oauthToken = oauthResponse.access_token;
        tokenExpiry = new Date(Date.now() + oauthResponse.expires_in * 1000);

        // Save OAuth token in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            oauthToken,
            tokenExpiry
          }
        });

        console.log(`✅ OAuth token obtained for user ${user.username}`);
      } catch (error) {
        console.error('❌ Failed to get OAuth token:', error);
        // Continue without OAuth token if it fails
        oauthToken = undefined;
      }
    } else {
      console.log('ℹ️ MCP or OAuth not enabled, skipping OAuth token generation');
    }

    // Generate JWT with or without OAuth token
    const token = this.generateJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      oauthToken
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
   * Get OAuth token from mock server
   * Only called if MCP and OAuth are enabled
   */
  private async getOAuthToken(user: User): Promise<{ access_token: string; expires_in: number }> {
    const url = `${OAUTH_CONFIG.mockServerUrl}${OAUTH_CONFIG.tokenEndpoint}`;
    
    console.log(`🔐 Requesting OAuth token from: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OAUTH_CONFIG.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.username,
          password: 'mock' // Mock server doesn't validate actual password
        }),
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

      return data;
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
   * Logout user (optional - can be used to invalidate OAuth token in DB)
   */
  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        oauthToken: null,
        tokenExpiry: null
      }
    });
  }
}

export const authService = new AuthService();

