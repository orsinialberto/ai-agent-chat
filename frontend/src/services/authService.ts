/**
 * Authentication Service
 * Manages JWT tokens in localStorage and provides helper methods
 */

import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'ai_agent_jwt';

interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  oauthToken?: string;
  oauthTokenExpiry?: number; // Unix timestamp in seconds
  exp: number; // Expiration timestamp
}

export class AuthService {
  /**
   * Save JWT token to localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Remove JWT token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Decode JWT token and get payload
   */
  decodeToken(): JWTPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if OAuth token is expired
   * Returns true if OAuth token exists and is expired, false otherwise
   */
  isOAuthTokenExpired(): boolean {
    const payload = this.decodeToken();
    if (!payload || !payload.oauthToken || !payload.oauthTokenExpiry) {
      // No OAuth token, so it's not expired (not applicable)
      return false;
    }

    // oauthTokenExpiry is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.oauthTokenExpiry;
  }

  /**
   * Check if token is expired (JWT or OAuth)
   * Returns true if either JWT or OAuth token is expired
   */
  isTokenExpired(): boolean {
    // Check JWT expiration
    const payload = this.decodeToken();
    if (!payload) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    const jwtExpired = payload.exp < currentTime;

    // Check OAuth token expiration if present
    const oauthExpired = this.isOAuthTokenExpired();

    // Token is expired if either JWT or OAuth token is expired
    return jwtExpired || oauthExpired;
  }

  /**
   * Check if user is authenticated (has valid token)
   * Now also checks OAuth token expiration if present
   */
  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  /**
   * Get current user info from token
   */
  getUser(): { userId: string; username: string; email: string } | null {
    const payload = this.decodeToken();
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    };
  }

  /**
   * Logout user (remove token)
   */
  logout(): void {
    this.removeToken();
  }

  /**
   * Get time until token expires (in seconds)
   * Returns null if no token or token is invalid
   */
  getTimeUntilExpiration(): number | null {
    const payload = this.decodeToken();
    if (!payload) {
      return null;
    }

    const currentTime = Date.now() / 1000;
    const timeRemaining = payload.exp - currentTime;
    return timeRemaining > 0 ? timeRemaining : 0;
  }
}

// Export singleton instance
export const authService = new AuthService();

