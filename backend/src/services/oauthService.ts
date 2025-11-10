/**
 * OAuth Service
 * Handles OAuth token management for MCP server authentication
 */

import { OAUTH_CONFIG } from '../config/oauthConfig';

export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
}

export class OAuthService {
  /**
   * Get OAuth token from OAuth server
   * Uses query params instead of body
   * @param username - Username for OAuth authentication
   * @param password - Password in plain text (only available during login)
   */
  async getToken(
    username: string,
    password: string
  ): Promise<OAuthTokenResponse> {
    const oauthServerUrl = OAUTH_CONFIG.mockServerUrl;
    const tokenEndpoint = OAUTH_CONFIG.tokenEndpoint;
    
    // Build URL with query params
    const url = new URL(`${oauthServerUrl}${tokenEndpoint}`);
    url.searchParams.append('grant_type', 'password');
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

      const data = await response.json() as { access_token?: string; expires_in?: number };
      
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
   * Check if OAuth token is expired
   * @param expiry - Unix timestamp in seconds
   * @returns true if token is expired, false otherwise
   */
  isTokenExpired(expiry: number): boolean {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    return now >= expiry;
  }

  /**
   * Validate OAuth token expiry
   * @param expiry - Unix timestamp in seconds
   * @throws Error if token is expired
   */
  validateTokenExpiry(expiry: number): void {
    if (this.isTokenExpired(expiry)) {
      throw new Error('OAuth token has expired');
    }
  }

  /**
   * Calculate OAuth token expiry timestamp
   * @param expiresIn - Token expiration time in seconds
   * @returns Unix timestamp in seconds when token will expire
   */
  calculateExpiry(expiresIn: number): number {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }
}

// Export singleton instance
export const oauthService = new OAuthService();

