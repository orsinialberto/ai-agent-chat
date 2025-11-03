import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [error, setError] = useState('');

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
        // Logout and redirect to register
        logout();
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Back to Chat Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Chat</span>
          </button>

          {/* Settings Title */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* User Info Section */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Username</label>
                <p className="text-gray-900 mt-1 text-lg">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900 mt-1 text-lg">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-700 mb-4">
              Once you delete your account, there is no going back. All your chats and messages will be permanently deleted.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Delete Account
            </button>
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
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Your profile and account information</li>
              <li>All your chat conversations</li>
              <li>All your messages</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-700">Final Warning</h3>
            </div>
            <p className="text-gray-700 mb-6">
              This is your last chance to cancel. Clicking "Delete Forever" will immediately and permanently delete your account and all associated data. This action is <strong className="text-red-700">irreversible</strong>.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

