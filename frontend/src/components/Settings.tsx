import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { authService } from '../services/authService';

// Style constants for better maintainability
const styles = {
  container: "flex flex-col h-full",
  content: "overflow-y-auto py-4 px-4 sm:px-6",
  maxWidth: "max-w-3xl mx-auto space-y-5",
  
  // Header
  header: "mb-4",
  pageTitle: "text-2xl font-bold text-gray-900",
  
  // Buttons
  backButton: "inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group mb-4",
  backIcon: "w-4 h-4 transform group-hover:-translate-x-1 transition-transform",
  primaryButton: "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2",
  cancelButton: "flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
  dangerButton: "flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-300/60 focus:ring-offset-2",
  deleteIconButton: "p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0",
  
  // Cards and sections - come textarea con ombra inferiore
  card: "bg-white border border-gray-300 rounded-2xl p-5 shadow-[0_8px_14px_-12px_rgba(0,0,0,0.25)]",
  cardHeader: "flex items-center gap-2.5 mb-4",
  cardIcon: "w-5 h-5 text-gray-500 flex-shrink-0",
  cardTitle: "text-lg font-semibold text-gray-900",
  section: "space-y-3",
  
  // Forms
  formContainer: "space-y-3",
  formInputContainer: "group relative",
  formInputWrapper: "flex items-center gap-2.5 px-3 py-2 border border-gray-300 rounded-lg focus-within:border-gray-400 transition-colors bg-white",
  formInputIcon: "w-4 h-4 text-gray-400 flex-shrink-0",
  formInput: "flex-1 bg-transparent border-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0",
  formActions: "flex justify-end pt-2",
  
  // Info display
  infoCard: "rounded-lg p-4 border border-gray-300",
  infoRow: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2",
  infoLabel: "text-xs font-semibold text-gray-600 uppercase tracking-wide",
  infoValue: "text-gray-900 text-sm font-medium",
  
  // Alerts
  errorAlert: "mb-4 rounded-lg bg-rose-50 border border-rose-300 p-3 flex items-start gap-2",
  successAlert: "mb-4 rounded-lg bg-emerald-50 border border-emerald-300 p-3 flex items-start gap-2",
  alertIcon: "w-4 h-4 flex-shrink-0 mt-0.5",
  errorText: "text-sm text-rose-800 font-medium",
  successText: "text-sm text-emerald-800 font-medium",
  
  // Delete section
  deleteBox: "flex items-center justify-between p-4 rounded-lg border border-rose-300 hover:border-rose-400 transition-colors",
  deleteContent: "flex-1 pr-3",
  deleteTitle: "text-sm font-semibold text-gray-900 mb-1",
  deleteDescription: "text-xs text-gray-600 leading-relaxed",
  
  // Dialogs
  dialogOverlay: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fadeIn",
  dialogContainer: "bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-scaleIn",
  dialogContainerDanger: "bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-rose-300 animate-scaleIn",
  dialogTitle: "text-xl font-bold text-gray-900 mb-3",
  dialogText: "text-sm text-gray-600 mb-4 leading-relaxed",
  dialogList: "list-disc list-inside text-sm text-gray-600 mb-4 space-y-1.5 pl-2",
  dialogActions: "flex gap-3",
  
  // Warning icon container
  warningIconContainer: "w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0",
  warningIcon: "w-6 h-6 text-rose-600",
  warningHeader: "flex items-center gap-3 mb-4",
  warningTitle: "text-xl font-bold text-rose-700",
} as const;

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
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.maxWidth}>
          {/* Back to Chat Button */}
          <button
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Chat</span>
          </button>

          {/* Page Header */}
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Settings</h1>
          </div>

          {/* Account Information Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className={styles.cardTitle}>Account Information</h2>
            </div>
            <div className={styles.section}>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Username</label>
                  <p className={styles.infoValue}>{user?.username}</p>
                </div>
                <div className={styles.infoRow}>
                  <label className={styles.infoLabel}>Email</label>
                  <p className={styles.infoValue}>{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className={styles.cardTitle}>Change Password</h2>
            </div>

            <div className={styles.section}>
              {passwordError && (
                <div className={styles.errorAlert}>
                  <svg className={`${styles.alertIcon} text-rose-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className={styles.errorText}>{passwordError}</div>
                </div>
              )}

              {passwordSuccess && (
                <div className={styles.successAlert}>
                  <svg className={`${styles.alertIcon} text-emerald-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className={styles.successText}>{passwordSuccess}</div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className={styles.formContainer}>
                <div className={styles.formInputContainer}>
                  <div className={styles.formInputWrapper}>
                    <svg className={styles.formInputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                      className={styles.formInput}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className={styles.formInputContainer}>
                  <div className={styles.formInputWrapper}>
                    <svg className={styles.formInputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (min. 6 characters)"
                      className={styles.formInput}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className={styles.formInputContainer}>
                  <div className={styles.formInputWrapper}>
                    <svg className={styles.formInputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className={styles.formInput}
                      disabled={isChangingPassword}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className={styles.primaryButton}
                  >
                    {isChangingPassword ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Changing...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Password</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Delete Account Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg className={`${styles.cardIcon} text-rose-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className={styles.cardTitle}>Danger Zone</h2>
            </div>

            <div className={styles.section}>
              {error && (
                <div className={styles.errorAlert}>
                  <svg className={`${styles.alertIcon} text-rose-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className={styles.errorText}>{error}</div>
                </div>
              )}

              <div className={styles.deleteBox}>
                <div className={styles.deleteContent}>
                  <p className={styles.deleteTitle}>Delete your account permanently</p>
                  <p className={styles.deleteDescription}>
                    Once you delete your account, there is no going back. This action will permanently delete all your data, including your profile, conversations, and messages.
                  </p>
                </div>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={styles.deleteIconButton}
                  title="Delete Account"
                  aria-label="Delete Account"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContainer}>
            <h3 className={styles.dialogTitle}>Delete Account?</h3>
            <p className={styles.dialogText}>
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
            </p>
            <ul className={styles.dialogList}>
              <li>Your profile and account information</li>
              <li>All your chat conversations</li>
              <li>All your messages</li>
            </ul>
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className={styles.dangerButton}
              >
                Yes, I'm sure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirmation Dialog */}
      {showFinalConfirm && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContainerDanger}>
            <div className={styles.warningHeader}>
              <div className={styles.warningIconContainer}>
                <svg className={styles.warningIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className={styles.warningTitle}>Final Warning</h3>
            </div>
            <p className={styles.dialogText}>
              This is your last chance to cancel. Clicking "Delete Forever" will immediately and permanently delete your account and all associated data. This action is <strong className="text-rose-700">irreversible</strong>.
            </p>
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className={`${styles.cancelButton} ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isDeleting}
                className={`${styles.dangerButton} ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

