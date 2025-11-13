/**
 * Register Dialog Component
 * Allows users to register with username, email and password in a dialog
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog } from '../Dialog';

interface RegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterDialog: React.FC<RegisterDialogProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(username, email, password);
      
      if (result.success) {
        // Close dialog
        onClose();
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    onClose();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="md" showCloseButton={true}>
      <div className="bg-white rounded-lg shadow-xl p-10">
        {/* Logo Circle */}
        <div className="flex justify-center mb-8">
          <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
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
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="text-xs text-red-600 text-center">{error}</div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Username Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="flex-1 bg-transparent border-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    style={{ 
                      letterSpacing: '0.05em'
                    }}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="flex-1 bg-transparent border-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    style={{ 
                      letterSpacing: '0.05em'
                    }}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="flex-1 bg-transparent border-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    style={{ 
                      letterSpacing: '0.05em'
                    }}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-300 focus-within:border-blue-500 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="flex-1 bg-transparent border-0 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    style={{ 
                      letterSpacing: '0.05em'
                    }}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Register Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 text-sm font-semibold tracking-wider text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase"
                style={{ borderRadius: '20px' }}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>

            {/* Login link */}
            <div className="text-center text-sm text-gray-600 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleLoginClick}
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none"
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

