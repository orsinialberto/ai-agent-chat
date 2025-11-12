/**
 * Authentication Context
 * Provides authentication state and methods to the entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, Chat } from '../services/api';
import { authService } from '../services/authService';
import { AnonymousChatService } from '../services/anonymousChatService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }>;
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
      // Check if user is still authenticated (token exists and is valid)
      if (user && !authService.isAuthenticated()) {
        // Token was removed or expired - logout silently and remain as anonymous user
        console.log('Session expired, switching to anonymous mode');
        authService.removeToken();
        setUser(null);
      } else if (authService.hasToken() && authService.isTokenExpired()) {
        // Token exists but is expired - remove it and logout silently
        const payload = authService.decodeToken();
        const isOAuthExpired = payload?.oauthTokenExpiry && 
          Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry;
        
        console.log(isOAuthExpired 
          ? 'OAuth token expired detected by periodic check, switching to anonymous mode'
          : 'Token expired detected by periodic check, switching to anonymous mode');
        authService.removeToken();
        setUser(null);
      }
    }, 30000); // Check every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Listen for token removal from localStorage (e.g., from api.ts)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai_agent_jwt' && e.newValue === null && user) {
        // Token was removed from localStorage - update user state
        console.log('Token removed from storage, switching to anonymous mode');
        setUser(null);
      }
    };

    // Listen for storage events (when token is removed in another tab/window)
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically if token was removed in same window
    const checkTokenRemoval = setInterval(() => {
      if (user && !authService.hasToken()) {
        console.log('Token removed, switching to anonymous mode');
        setUser(null);
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkTokenRemoval);
    };
  }, [user]);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }> => {
    try {
      const response = await apiService.login({ usernameOrEmail, password });

      if (response.success && response.data) {
        // Save token
        authService.setToken(response.data.token);
        
        // Set user
        setUser(response.data.user);

        // Migrate anonymous chats if any exist
        const anonymousChats = AnonymousChatService.getChats();
        let migratedChats: Chat[] = [];
        
        if (anonymousChats.length > 0) {
          try {
            const migrateResponse = await apiService.migrateAnonymousChats(anonymousChats);
            if (migrateResponse.success && migrateResponse.data?.migratedChats) {
              migratedChats = migrateResponse.data.migratedChats;
              // Clear anonymous chats from sessionStorage after successful migration
              AnonymousChatService.clearChats();
            } else {
              console.error('Failed to migrate anonymous chats:', migrateResponse.error);
              // Don't fail login if migration fails, just log the error
            }
          } catch (migrateError) {
            console.error('Error migrating anonymous chats:', migrateError);
            // Don't fail login if migration fails, just log the error
          }
        }

        return { success: true, migratedChats };
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

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string; migratedChats?: Chat[] }> => {
    try {
      const response = await apiService.register({ username, email, password });

      if (response.success && response.data) {
        // Save token
        authService.setToken(response.data.token);
        
        // Set user
        setUser(response.data.user);

        // Migrate anonymous chats if any exist
        const anonymousChats = AnonymousChatService.getChats();
        let migratedChats: Chat[] = [];
        
        if (anonymousChats.length > 0) {
          try {
            const migrateResponse = await apiService.migrateAnonymousChats(anonymousChats);
            if (migrateResponse.success && migrateResponse.data?.migratedChats) {
              migratedChats = migrateResponse.data.migratedChats;
              // Clear anonymous chats from sessionStorage after successful migration
              AnonymousChatService.clearChats();
            } else {
              console.error('Failed to migrate anonymous chats:', migrateResponse.error);
              // Don't fail registration if migration fails, just log the error
            }
          } catch (migrateError) {
            console.error('Error migrating anonymous chats:', migrateError);
            // Don't fail registration if migration fails, just log the error
          }
        }

        return { success: true, migratedChats };
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
    
    // Clear anonymous chats from sessionStorage (optional - could keep them)
    // sessionStorage.clear();
    
    // Refresh page to reset all state and show new anonymous chat
    window.location.href = '/';
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

