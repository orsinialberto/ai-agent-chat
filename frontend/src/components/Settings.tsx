import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { authService } from '../services/authService';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [error, setError] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
    setError('');
  };

  const handleFirstConfirm = () => {
    setShowConfirmDialog(false);
    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const response = await apiService.deleteAccount();

      if (response.success) {
        // Clear token locally (user is already deleted on backend)
        authService.removeToken();
        
        // Clear remembered credentials
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
        
        // Redirect to register
        navigate('/register');
      } else {
        setError(response.message || response.error || 'Failed to delete account');
        setIsDeleting(false);
        setShowFinalConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('An unexpected error occurred');
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setShowFinalConfirm(false);
    setError('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await apiService.changePassword({
        currentPassword,
        newPassword
      });

      if (response.success) {
        setPasswordSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(response.message || response.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back to Chat Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Chat</span>
          </button>

          {/* Settings Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-[0_8px_14px_-12px_rgba(0,0,0,0.25)]">
            {/* Settings Title */}
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">Settings</h1>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6"></div>

            {/* Account Information Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-3 bg-gray-100 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-gray-900 text-sm font-medium">{user?.username}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900 text-sm font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              
              {passwordError && (
                <div className="mb-4 rounded-lg bg-rose-100 border border-rose-300 p-3">
                  <div className="text-sm text-rose-800">{passwordError}</div>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 rounded-lg bg-mint-100 border border-mint-300 p-3">
                  <div className="text-sm text-mint-800">{passwordSuccess}</div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex items-center border-b border-gray-300 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="flex items-center border-b border-gray-300 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="flex items-center border-b border-gray-300 focus-within:border-sky-400 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="flex-1 bg-transparent border-0 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2"
                  >
                    <span>{isChangingPassword ? 'Changing...' : 'Save'}</span>
                    {!isChangingPassword && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6"></div>

            {/* Delete Account Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h2>
              
              {error && (
                <div className="mb-4 rounded-lg bg-rose-100 border border-rose-300 p-3">
                  <div className="text-sm text-rose-800">{error}</div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Permanently delete your account</p>
                  <p className="text-xs text-gray-500">
                    Once you delete your account, there is no going back. This will permanently delete all your data.
                  </p>
                </div>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="ml-4 p-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Delete Account"
                  aria-label="Delete Account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Delete Account?</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2 pl-2">
              <li>Your profile and account information</li>
              <li>All your chat conversations</li>
              <li>All your messages</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-peach-100/60 hover:bg-peach-200/70 text-gray-800 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-peach-200/60 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300/60 focus:ring-offset-2"
              >
                Yes, I'm sure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Dialog */}
      {showFinalConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-rose-700">Final Warning</h3>
            </div>
            <p className="text-gray-700 mb-6">
              This is your last chance to cancel. Clicking "Delete Forever" will immediately and permanently delete your account and all associated data. This action is <strong className="text-rose-700">irreversible</strong>.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-peach-100/60 hover:bg-peach-200/70 text-gray-800 rounded-xl font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-peach-200/60 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300/60 focus:ring-offset-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

