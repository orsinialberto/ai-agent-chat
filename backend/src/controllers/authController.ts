/**
 * Authentication Controller
 * Handles user registration, login, and logout endpoints
 */

import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '../types/shared';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(
    req: Request<{}, ApiResponse<AuthResponse>, RegisterRequest>,
    res: Response<ApiResponse<AuthResponse>>
  ) {
    try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Username, email, and password are required'
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        });
      }

      // Password strength validation
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long'
        });
      }

      // Username validation
      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_USERNAME',
          message: 'Username must be at least 3 characters long'
        });
      }

      // Register user
      const authResponse = await authService.register({ username, email, password });

      return res.status(201).json({
        success: true,
        data: authResponse
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error messages from service
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      if (errorMessage.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_USER',
          message: errorMessage
        });
      }

      return res.status(500).json({
        success: false,
        error: 'REGISTRATION_ERROR',
        message: errorMessage
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(
    req: Request<{}, ApiResponse<AuthResponse>, LoginRequest>,
    res: Response<ApiResponse<AuthResponse>>
  ) {
    try {
      const { usernameOrEmail, password } = req.body;

      // Validation
      if (!usernameOrEmail || !password) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Username/email and password are required'
        });
      }

      // Login user
      const authResponse = await authService.login({ usernameOrEmail, password });

      return res.status(200).json({
        success: true,
        data: authResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Don't reveal whether username or password was incorrect
      if (errorMessage.includes('Invalid credentials')) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid username/email or password'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'LOGIN_ERROR',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Logout user (optional - invalidates OAuth token in DB)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response<ApiResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }

      await authService.logout(req.user.userId);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        error: 'LOGOUT_ERROR',
        message: 'An error occurred during logout'
      });
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response<ApiResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Not authenticated'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          userId: req.user.userId,
          username: req.user.username,
          email: req.user.email
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An error occurred'
      });
    }
  }
}

export const authController = new AuthController();

