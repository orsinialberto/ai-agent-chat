/**
 * Authentication Controller
 * Handles user registration, login, and logout endpoints
 */

import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { RegisterRequest, LoginRequest, ChangePasswordRequest, AuthResponse, ApiResponse } from '../types/shared';
import { ResponseHelper } from '../utils/responseHelpers';

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
        return ResponseHelper.validationError(res, 'Username, email, and password are required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ResponseHelper.badRequest(res, 'Please provide a valid email address', 'INVALID_EMAIL');
      }

      // Password strength validation
      if (password.length < 6) {
        return ResponseHelper.badRequest(res, 'Password must be at least 6 characters long', 'WEAK_PASSWORD');
      }

      // Username validation
      if (username.length < 3) {
        return ResponseHelper.badRequest(res, 'Username must be at least 3 characters long', 'INVALID_USERNAME');
      }

      // Register user
      const authResponse = await authService.register({ username, email, password });

      return ResponseHelper.success(res, authResponse, 201);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error messages from service
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      if (errorMessage.includes('already exists')) {
        return ResponseHelper.error(res, 'DUPLICATE_USER', errorMessage, 409);
      }

      return ResponseHelper.internalError(res, errorMessage, 'REGISTRATION_ERROR');
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
        return ResponseHelper.validationError(res, 'Username/email and password are required');
      }

      // Login user
      const authResponse = await authService.login({ usernameOrEmail, password });

      return ResponseHelper.success(res, authResponse);
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Don't reveal whether username or password was incorrect
      if (errorMessage.includes('Invalid credentials')) {
        return ResponseHelper.unauthorized(res, 'Invalid username/email or password');
      }

      return ResponseHelper.internalError(res, 'An error occurred during login', 'LOGIN_ERROR');
    }
  }

  /**
   * Logout user (optional - invalidates OAuth token in DB)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response<ApiResponse>) {
    try {
      // req.user is guaranteed by authenticate middleware
      await authService.logout(req.user!.userId);

      return ResponseHelper.success(res, { message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseHelper.internalError(res, 'An error occurred during logout', 'LOGOUT_ERROR');
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response<ApiResponse>) {
    try {
      // req.user is guaranteed by authenticate middleware
      return ResponseHelper.success(res, {
        userId: req.user!.userId,
        username: req.user!.username,
        email: req.user!.email
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return ResponseHelper.internalError(res, 'An error occurred', 'SERVER_ERROR');
    }
  }

  /**
   * Change password
   * PUT /api/auth/password
   */
  async changePassword(
    req: Request<{}, ApiResponse, ChangePasswordRequest>,
    res: Response<ApiResponse>
  ) {
    try {
      // req.user is guaranteed by authenticate middleware
      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        return ResponseHelper.validationError(res, 'Current password and new password are required');
      }

      if (newPassword.length < 6) {
        return ResponseHelper.badRequest(res, 'New password must be at least 6 characters long', 'WEAK_PASSWORD');
      }

      const userId = req.user!.userId;
      await authService.changePassword(userId, currentPassword, newPassword);

      return ResponseHelper.success(res, { message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      
      if (errorMessage.includes('incorrect')) {
        return ResponseHelper.unauthorized(res, 'Current password is incorrect');
      }

      if (errorMessage.includes('not found')) {
        return ResponseHelper.notFound(res, errorMessage);
      }

      return ResponseHelper.internalError(res, 'An error occurred while changing password', 'PASSWORD_CHANGE_ERROR');
    }
  }

  /**
   * Delete user account
   * DELETE /api/auth/account
   */
  async deleteAccount(req: Request, res: Response<ApiResponse>) {
    try {
      // req.user is guaranteed by authenticate middleware
      const userId = req.user!.userId;
      await authService.deleteUser(userId);

      return ResponseHelper.success(res, { message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      
      if (errorMessage.includes('not found')) {
        return ResponseHelper.notFound(res, errorMessage);
      }

      return ResponseHelper.internalError(res, 'An error occurred while deleting account', 'DELETE_ERROR');
    }
  }
}

export const authController = new AuthController();

