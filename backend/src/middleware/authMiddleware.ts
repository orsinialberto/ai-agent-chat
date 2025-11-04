/**
 * Authentication Middleware
 * Verifies JWT token and adds user info to request object
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { ApiResponse } from '../types/shared';
import { isOAuthEnabled } from '../config/oauthConfig';

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export const authenticate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No authorization token provided'
      });
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Authorization header must be in format: Bearer <token>'
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No token provided'
      });
      return;
    }

    // Verify token
    try {
      const payload = authService.verifyToken(token);
      
      // Verify OAuth token expiry only if OAuth is enabled
      if (isOAuthEnabled() && payload.oauthToken && payload.oauthTokenExpiry) {
        const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        
        if (now >= payload.oauthTokenExpiry) {
          // OAuth token expired - force logout
          console.log(`⚠️ OAuth token expired for user ${payload.username}`);
          res.status(401).json({
            success: false,
            error: 'OAUTH_TOKEN_EXPIRED',
            message: 'OAuth token has expired. Please log out and log in again.'
          });
          return;
        }
      }
      
      // Add user info to request object
      req.user = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        oauthToken: payload.oauthToken, // May be undefined if MCP or OAuth not enabled
        oauthTokenExpiry: payload.oauthTokenExpiry // May be undefined if OAuth not enabled
      };

      // Continue to next middleware/route handler
      next();
    } catch (error) {
      // Token verification failed (invalid or expired)
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional middleware - checks if user is authenticated but doesn't fail if not
 * Useful for endpoints that work differently for authenticated vs non-authenticated users
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = authService.verifyToken(token);
        req.user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          oauthToken: payload.oauthToken,
          oauthTokenExpiry: payload.oauthTokenExpiry
        };
      } catch (error) {
        // Token invalid but we don't fail - just continue without user
        console.log('Optional auth: Invalid token, continuing without user');
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue even on error
  }
};

