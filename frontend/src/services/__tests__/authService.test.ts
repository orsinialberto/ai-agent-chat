import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../authService';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn()
}));

const mockJwtDecode = vi.mocked(jwtDecode);

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const token = 'test-token';
      authService.setToken(token);
      expect(authService.getToken()).toBe(token);
    });

    it('should remove token', () => {
      authService.setToken('test-token');
      authService.removeToken();
      expect(authService.getToken()).toBeNull();
    });

    it('should check if token exists', () => {
      expect(authService.hasToken()).toBe(false);
      authService.setToken('test-token');
      expect(authService.hasToken()).toBe(true);
    });
  });

  describe('OAuth Token Expiration', () => {
    it('should return false when no OAuth token is present', () => {
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // Valid JWT
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isOAuthTokenExpired()).toBe(false);
    });

    it('should return false when OAuth token is valid', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: futureTime,
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isOAuthTokenExpired()).toBe(false);
    });

    it('should return true when OAuth token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime,
        exp: Math.floor(Date.now() / 1000) + 3600 // Valid JWT
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isOAuthTokenExpired()).toBe(true);
    });

    it('should return false when oauthToken is present but oauthTokenExpiry is missing', () => {
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isOAuthTokenExpired()).toBe(false);
    });
  });

  describe('Token Expiration (JWT and OAuth)', () => {
    it('should return true when JWT is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isTokenExpired()).toBe(true);
    });

    it('should return true when OAuth token is expired but JWT is valid', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime, // Expired
        exp: futureTime // Valid JWT
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isTokenExpired()).toBe(true);
    });

    it('should return false when both JWT and OAuth token are valid', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: futureTime,
        exp: futureTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isTokenExpired()).toBe(false);
    });

    it('should return true when token cannot be decoded', () => {
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      authService.setToken('invalid-token');

      expect(authService.isTokenExpired()).toBe(true);
    });

    it('should return true when no token exists', () => {
      expect(authService.isTokenExpired()).toBe(true);
    });
  });

  describe('Authentication Status', () => {
    it('should return false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: futureTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when OAuth token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime, // Expired
        exp: futureTime // Valid JWT
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('User Info', () => {
    it('should return user info from token', () => {
      const payload = {
        userId: '1',
        username: 'testuser',
        email: 'test@test.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      const user = authService.getUser();
      expect(user).toEqual({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });
    });

    it('should return null when token cannot be decoded', () => {
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      authService.setToken('invalid-token');

      expect(authService.getUser()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('Token Expiration Time', () => {
    it('should return time until expiration', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: futureTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      const timeRemaining = authService.getTimeUntilExpiration();
      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(3600);
    });

    it('should return 0 when token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = {
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime
      };
      mockJwtDecode.mockReturnValue(payload as any);
      authService.setToken('test-token');

      expect(authService.getTimeUntilExpiration()).toBe(0);
    });

    it('should return null when token cannot be decoded', () => {
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      authService.setToken('invalid-token');

      expect(authService.getTimeUntilExpiration()).toBeNull();
    });
  });
});

