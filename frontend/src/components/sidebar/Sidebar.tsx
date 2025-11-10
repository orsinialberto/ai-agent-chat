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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  onAddChatReady,
  isOpen = true,
  onToggle,
  isAnonymous = false,
  onLoginClick
}) => {
  const [showChatList, setShowChatList] = React.useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const { 
    chats, 
    isLoading, 
    error, 
    selectChat, 
    updateChatTitle, 
    deleteChat, 
    createNewChat,
    addChat,
    clearError,
    loadChats
  } = useSidebar({ isAnonymous });

  // Reload chats when authentication status changes (from anonymous to authenticated)
  React.useEffect(() => {
    if (!isAnonymous) {
      loadChats();
    }
  }, [isAnonymous, loadChats]);

  const handleLogout = () => {
    logout();
    navigate('/');
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
      <div className={`
        fixed top-0 left-0 h-screen bg-gray-800 border-r border-gray-700 z-50
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'w-72' : 'w-14'}
      `}>
        <div className="flex flex-col h-full relative group/sidebar">
          {isOpen ? (
            <>
              {/* Header con toggle allineato */}
              <div className="flex items-end justify-between pl-6 pr-4 pt-4 pb-6">
                <div className="flex items-end gap-3">
                  <img 
                    src="/images/ai-icon.png" 
                    alt="AI" 
                    className="w-10 h-10 mb-1.5"
                  />
                  <span className="text-2xl font-light text-gray-100 tracking-wider">AI Agent</span>
                </div>
                
                {/* Toggle Button - visibile solo al hover quando aperta */}
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-all duration-200 opacity-0 group-hover/sidebar:opacity-100 mb-0.5"
                  title="Close sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* New Chat Button */}
              <div className="pb-4">
                <NewChatButton onClick={handleNewChat} />
              </div>
            </>
          ) : (
            <>
              {/* Bottoni incolonnati quando chiusa */}
              <div className="pt-4 pb-10 flex flex-col items-center gap-2">
                {/* Toggle Button - sempre visibile quando chiusa */}
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                  title="Open sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
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
              {/* Chats Title with Toggle */}
              <div className="pl-6 pr-6 py-2 flex items-center cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => setShowChatList(!showChatList)}>
                <h1 className="text-base font-medium text-gray-300 tracking-wide">Chats</h1>
                <button
                  className="ml-1 p-1 text-gray-400 hover:text-gray-200 transition-colors"
                  title={showChatList ? "Hide chats" : "Show chats"}
                >
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showChatList ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Chat List */}
              {showChatList && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <ChatList
                    chats={chats}
                    currentChatId={currentChatId}
                    isLoading={isLoading}
                    error={error}
                    onChatSelect={handleChatSelect}
                    onUpdateTitle={updateChatTitle}
                    onDeleteChat={deleteChat}
                    onClearError={clearError}
                  />
                </div>
              )}

              {/* User info and login/logout at bottom */}
              <div className="mt-auto border-t border-gray-700 p-4">
                {isAnonymous ? (
                  // Anonymous user - show Login icon button
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-300 truncate">Anonymous</span>
                    </div>
                    <button
                      onClick={handleLogin}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
                      title="Login"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  // Authenticated user - show username and logout button
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-300 truncate">{user?.username || 'User'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => navigate('/settings')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
                        title="Settings"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
                        title="Logout"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Buttons at bottom when closed */}
          {!isOpen && (
            <div className="mt-auto border-t border-gray-700 pt-4 pb-4 flex flex-col items-center gap-2">
              {!isAnonymous && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              {isAnonymous ? (
                <button
                  onClick={handleLogin}
                  className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                  title="Login"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
