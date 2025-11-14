import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatList } from './ChatList';
import { NewChatButton } from './NewChatButton';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Chat } from '../../services/api';

interface SidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAddChatReady?: (addChat: (chat: Chat) => void) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  isAnonymous?: boolean;
  onLoginClick?: () => void;
  onHomeClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  onAddChatReady,
  isOpen = true,
  onToggle,
  isAnonymous = false,
  onLoginClick,
  onHomeClick
}) => {
  const [showChatList, setShowChatList] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const { 
    chats, 
    isLoading, 
    error, 
    updateChatTitle, 
    deleteChat, 
    createNewChat,
    addChat,
    clearError,
    loadChats
  } = useSidebar({ isAnonymous });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredChats = React.useMemo(
    () =>
      chats.filter((chat) =>
        (chat.title || 'Untitled chat')
          .toLowerCase()
          .includes(normalizedSearch)
      ),
    [chats, normalizedSearch]
  );

  const hasSearch = normalizedSearch.length > 0;
  const visibleChats = hasSearch ? filteredChats : chats;
  const showEmptyState = !isLoading && !error && visibleChats.length === 0;
  const emptyStateLabel = hasSearch
    ? 'No chats match your search'
    : 'No chats yet';

  // Reload chats when authentication status changes (from anonymous to authenticated)
  React.useEffect(() => {
    if (!isAnonymous) {
      loadChats();
    }
  }, [isAnonymous, loadChats]);

  const handleLogout = () => {
    // logout() now handles page refresh internally
    logout();
  };

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/login');
    }
  };

  // Expose addChat to parent component
  React.useEffect(() => {
    if (onAddChatReady) {
      onAddChatReady(addChat);
    }
  }, [onAddChatReady, addChat]);

  const handleChatSelect = (chatId: string) => {
    // Just notify parent - ChatInterface will load the chat data
    // This avoids duplicate API calls
    onChatSelect(chatId);
  };

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    if (newChat) {
      // Chat was created (authenticated user)
      onNewChat();
      onChatSelect(newChat.id);
    } else {
      // No chat created yet (anonymous user - chat will be created on first message)
      onNewChat();
      // Don't call onChatSelect because there's no chat ID yet
    }
  };

  const handleClearSearch = () => setSearchTerm('');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        data-sidebar
        className={`
          fixed top-0 left-0 h-screen bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'w-72' : 'w-14'}
          overflow-hidden
        `}>
        <div className="flex flex-col h-full relative group/sidebar">
          {isOpen ? (
            <>
              {/* Header & quick actions */}
              <div className="pl-4 pr-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (onHomeClick) {
                        onHomeClick();
                      } else {
                        navigate('/');
                        if (onNewChat) {
                          onNewChat();
                        }
                      }
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group/logo"
                    title="Go to home"
                  >
                    <img 
                      src="/images/ai-icon.png" 
                      alt="AI" 
                      className="w-10 h-10 group-hover/logo:scale-105 transition-transform"
                    />
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Workspace</p>
                      <span className="text-2xl font-light text-gray-800 dark:text-gray-100 tracking-wider whitespace-nowrap">AI Agent</span>
                    </div>
                  </button>

                  <div className="flex items-center -mr-4">
                    {onToggle && (
                      <button
                        onClick={onToggle}
                        className="sidebar-ghost-btn"
                        title="Close sidebar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="-ml-4 -mr-6 h-px bg-gray-200 dark:bg-gray-700/70" />

                <div className="space-y-1.5">
                  <button
                    onClick={handleNewChat}
                    className="sidebar-minimal-btn"
                    title="New Chat"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      New Chat
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      if (isAnonymous) {
                        handleLogin();
                      } else {
                        navigate('/settings');
                      }
                    }}
                    className={`sidebar-minimal-btn ${isAnonymous ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={isAnonymous ? 'Login to access settings' : 'Open settings'}
                    disabled={isAnonymous}
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </span>
                  </button>
                </div>
              </div>

              {/* Chats Title + search */}
              <div className="pl-4 pr-6 pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Chats</p>
                  <h1 className="text-lg font-medium text-gray-800 dark:text-gray-100">Inbox</h1>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search chats"
                      className="w-full pl-10 pr-10 py-2 text-sm rounded-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    className={`sidebar-ghost-btn -mr-4 transition-transform duration-200 ${showChatList ? 'rotate-180' : ''}`}
                    title={showChatList ? "Hide chats" : "Show chats"}
                    onClick={() => setShowChatList(!showChatList)}
                  >
                    <svg 
                      className="w-4 h-4"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header quando chiusa */}
              <div className="pt-4 pb-4 flex flex-col items-center gap-2">
                {/* AI Icon Button - torna alla home */}
                <button
                  onClick={() => {
                    if (onHomeClick) {
                      onHomeClick();
                    } else {
                      navigate('/');
                      if (onNewChat) {
                        onNewChat();
                      }
                    }
                  }}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors group/logo"
                  title="Go to home"
                >
                  <img 
                    src="/images/ai-icon.png" 
                    alt="AI" 
                    className="w-8 h-8 group-hover/logo:scale-110 transition-transform"
                  />
                </button>

                {/* Toggle Button - sempre visibile quando chiusa */}
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Open sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {isOpen && (
            <>
              {/* Chat List */}
              {showChatList ? (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {showEmptyState ? (
                    <div className="pl-4 pr-6 py-8 text-center text-gray-400 dark:text-gray-500">
                      <p className="text-sm">{emptyStateLabel}</p>
                      {!hasSearch && (
                        <p className="text-xs mt-1">Create your first chat to get started</p>
                      )}
                    </div>
                  ) : (
                    <ChatList
                      chats={visibleChats}
                      currentChatId={currentChatId}
                      isLoading={isLoading}
                      error={error}
                      onChatSelect={handleChatSelect}
                      onUpdateTitle={updateChatTitle}
                      onDeleteChat={deleteChat}
                      onClearError={clearError}
                    />
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  Chats hidden
                </div>
              )}

              {/* User info and login/logout at bottom */}
              <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pl-4 pr-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-200">
                      {(user?.username || 'A').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {isAnonymous ? 'Anonymous' : user?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {isAnonymous ? 'Limited access' : 'Ready to go'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={isAnonymous ? handleLogin : handleLogout}
                    className="sidebar-ghost-btn -mr-4"
                    title={isAnonymous ? 'Login' : 'Logout'}
                  >
                    {isAnonymous ? (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Buttons at bottom when closed */}
          {!isOpen && (
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 pb-4 flex flex-col items-center gap-2">
              {!isAnonymous && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              {isAnonymous ? (
                <button
                  onClick={handleLogin}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Login"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
