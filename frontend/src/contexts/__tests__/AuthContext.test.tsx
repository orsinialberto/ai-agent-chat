import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';
import React from 'react';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getUser: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    hasToken: vi.fn(),
    isTokenExpired: vi.fn(),
    decodeToken: vi.fn()
  }
}));

// Mock apiService
vi.mock('../../services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}));

const mockAuthService = vi.mocked(authService);
const mockApiService = vi.mocked(apiService);

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
          <div data-testid="username">{user?.username || 'no-user'}</div>
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initial Authentication Check', () => {
    it('should load user when authenticated on mount', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('username')).toHaveTextContent('testuser');
      });

      expect(getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should not load user when not authenticated on mount', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('username')).toHaveTextContent('no-user');
      });

      expect(getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('Periodic Token Expiration Check', () => {
    it('should detect OAuth token expiration and logout after 30 seconds', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const futureTime = Math.floor(Date.now() / 1000) + 3600;

      // Initially authenticated
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Simulate token expiration after 30 seconds
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        oauthToken: 'oauth-token',
        oauthTokenExpiry: pastTime, // Expired OAuth token
        exp: futureTime
      } as any);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockAuthService.removeToken).toHaveBeenCalled();
        expect(mockLocation.href).toBe('/login?error=oauth_expired');
      });
    });

    it('should detect JWT token expiration and logout after 30 seconds', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;

      // Initially authenticated
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      });

      // Simulate token expiration after 30 seconds
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.decodeToken.mockReturnValue({
        userId: '1',
        username: 'test',
        email: 'test@test.com',
        exp: pastTime // Expired JWT
      } as any);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockAuthService.removeToken).toHaveBeenCalled();
        expect(mockLocation.href).toBe('/login?error=session_expired');
      });
    });

    it('should not logout when token is still valid after 30 seconds', async () => {
      // Initially authenticated
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      });

      // Advance time by 30 seconds - token still valid
      vi.advanceTimersByTime(30000);

      // Wait a bit to ensure no logout was triggered
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAuthService.removeToken).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('');
    });

    it('should check token expiration every 30 seconds', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        userId: '1',
        username: 'testuser',
        email: 'test@test.com'
      });
      mockAuthService.hasToken.mockReturnValue(true);
      mockAuthService.isTokenExpired.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      });

      // First check at 30 seconds
      vi.advanceTimersByTime(30000);
      expect(mockAuthService.isTokenExpired).toHaveBeenCalledTimes(1);

      // Second check at 60 seconds
      vi.advanceTimersByTime(30000);
      expect(mockAuthService.isTokenExpired).toHaveBeenCalledTimes(2);

      // Third check at 90 seconds
      vi.advanceTimersByTime(30000);
      expect(mockAuthService.isTokenExpired).toHaveBeenCalledTimes(3);
    });

    it('should not check token expiration when no token exists', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.hasToken.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      });

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      // Should not check expiration when no token
      expect(mockAuthService.isTokenExpired).not.toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully and set token', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockApiService.login.mockResolvedValue({
        success: true,
        data: {
          token: 'test-token',
          user: mockUser,
          expiresAt: new Date().toISOString()
        }
      });

      const TestLoginComponent = () => {
        const { login } = useAuth();
        
        React.useEffect(() => {
          login('testuser', 'password');
        }, [login]);
        
        return <div>Login</div>;
      };

      render(
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockAuthService.setToken).toHaveBeenCalledWith('test-token');
      });
    });
  });
});

