/**
 * Login Page Component
 * Allows users to log in with username/email and password
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const REMEMBER_ME_KEY = 'rememberMe';
const SAVED_USERNAME_KEY = 'savedUsername';
const SAVED_PASSWORD_KEY = 'savedPassword';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (savedRememberMe) {
      const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY) || '';
      const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY) || '';
      setUsernameOrEmail(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(usernameOrEmail, password);
      
      if (result.success) {
        // Save or clear credentials based on rememberMe
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(SAVED_USERNAME_KEY, usernameOrEmail);
          localStorage.setItem(SAVED_PASSWORD_KEY, password);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(SAVED_USERNAME_KEY);
          localStorage.removeItem(SAVED_PASSWORD_KEY);
        }
        
        // Redirect to main app
        navigate('/');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xs w-full">
        {/* Logo Circle */}
        <div className="flex justify-center mb-8">
          <div className="w-36 h-36 rounded-full bg-gray-800 flex items-center justify-center">
            <img 
              src="/images/ai-icon.png" 
              alt="AI" 
              className="w-20 h-20"
            />
          </div>
        </div>
        
        {/* Form */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-700 p-3">
              <div className="text-xs text-red-200 text-center">{error}</div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Username/Email Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-600 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    required
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
                    placeholder="Username or Email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-600 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <div className="relative flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="sr-only"
                />
                <div 
                  onClick={() => !isLoading && setRememberMe(!rememberMe)}
                  className={`h-3.5 w-3.5 cursor-pointer transition-colors ${
                    rememberMe 
                      ? 'bg-gray-700' 
                      : 'bg-gray-800'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
                >
                  {rememberMe && (
                    <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <label 
                htmlFor="rememberMe" 
                onClick={() => !isLoading && setRememberMe(!rememberMe)}
                className="ml-2 block text-xs text-gray-400 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 text-sm font-semibold tracking-wider text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase"
                style={{ borderRadius: '20px' }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            {/* Sign up link */}
            <div className="text-center text-xs text-gray-400 pt-1">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                Create a new account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

