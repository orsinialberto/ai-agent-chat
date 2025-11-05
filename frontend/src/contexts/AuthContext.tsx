/**
 * Authentication Context
 * Provides authentication state and methods to the entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, RegisterRequest, LoginRequest } from '../services/api';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const userInfo = authService.getUser();
        if (userInfo) {
          setUser({
            id: userInfo.userId,
            username: userInfo.username,
            email: userInfo.email,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Periodic check for token expiration (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (authService.hasToken()) {
        // Check if token is expired (JWT or OAuth)
        if (authService.isTokenExpired()) {
          // Check if it's OAuth token expiration before removing token
          const payload = authService.decodeToken();
          const isOAuthExpired = payload?.oauthTokenExpiry && 
            Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry;
          
          console.log(isOAuthExpired 
            ? 'OAuth token expired detected by periodic check, logging out'
            : 'Token expired detected by periodic check, logging out');
          authService.removeToken();
          setUser(null);
          // Redirect to login page with appropriate error
          const errorParam = isOAuthExpired ? '?error=oauth_expired' : '?error=session_expired';
          window.location.href = `/login${errorParam}`;
        }
      }
    }, 30000); // Check every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login({ usernameOrEmail, password });

      if (response.success && response.data) {
        // Save token
        authService.setToken(response.data.token);
        
        // Set user
        setUser(response.data.user);

        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || response.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.register({ username, email, password });

      if (response.success && response.data) {
        // Save token
        authService.setToken(response.data.token);
        
        // Set user
        setUser(response.data.user);

        return { success: true };
      } else {
        return {
          success: false,
          error: response.message || response.error || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Call backend logout (optional - mainly for cleanup)
    apiService.logout().catch(err => console.error('Logout error:', err));
    
    // Clear token
    authService.removeToken();
    
    // Clear remembered credentials
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    
    // Clear user
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

