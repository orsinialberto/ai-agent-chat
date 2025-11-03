/**
 * Register Page Component
 * Allows new users to create an account
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

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
        // Redirect to main app
        navigate('/');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
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
              {/* Username Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-600 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
                    placeholder="Username (min 3 characters)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-600 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-600 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
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
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            {/* Sign in link */}
            <div className="text-center text-xs text-gray-400 pt-1">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

