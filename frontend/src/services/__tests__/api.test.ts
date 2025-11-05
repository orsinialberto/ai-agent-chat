import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../api';
import { authService } from '../authService';

// Mock authService
vi.mock('../authService', () => ({
  authService: {
    hasToken: vi.fn(),
    isTokenExpired: vi.fn(),
    decodeToken: vi.fn(),
    removeToken: vi.fn(),
    getToken: vi.fn()
  }
}));

const mockAuthService = vi.mocked(authService);

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock fetch
global.fetch = vi.fn();

describe('ApiService - OAuth Token Expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('OAuth Token Expiration Handling', () => {
    it('should detect OAuth token expiration and redirect with error param', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime, // Expired OAuth token
        exp: futureTime // Valid JWT
      } as any);

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login?error=oauth_expired');
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAUTH_TOKEN_EXPIRED');
      expect(result.message).toBe('OAuth token has expired. Please log in again.');
    });

    it('should detect JWT token expiration and redirect without error param', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime // Expired JWT
      } as any);

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
      expect(result.message).toBe('Your session has expired. Please log in again.');
    });

    it('should handle expired token when oauthTokenExpiry is not present', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime // Expired JWT, no OAuth token
      } as any);

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should handle expired token when decodeToken returns null', async () => {
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue(null);

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
      expect(result.success).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('should proceed with request when token is valid', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', title: 'Test Chat' }]
      };

      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getToken.mockReturnValue('valid-token');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe('Backend OAuth Token Expiration Response', () => {
    it('should handle OAUTH_TOKEN_EXPIRED error from backend', async () => {
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getToken.mockReturnValue('valid-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'OAUTH_TOKEN_EXPIRED',
          message: 'OAuth token has expired. Please log out and log in again.'
        })
      });

      const result = await apiService.getChats();

      expect(mockAuthService.removeToken).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login?error=oauth_expired');
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAUTH_TOKEN_EXPIRED');
      expect(result.message).toBe('OAuth token has expired. Please log out and log in again.');
    });
  });
});

