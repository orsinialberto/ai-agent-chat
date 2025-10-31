import React from 'react';
import { ChatList } from './ChatList';
import { NewChatButton } from './NewChatButton';
import { useSidebar } from '../../hooks/useSidebar';
import { Chat } from '../../services/api';

interface SidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onAddChatReady?: (addChat: (chat: Chat) => void) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  onAddChatReady,
  isOpen = true,
  onToggle
}) => {
  const [showChatList, setShowChatList] = React.useState(true);
  
  const { 
    chats, 
    isLoading, 
    error, 
    selectChat, 
    updateChatTitle, 
    deleteChat, 
    createNewChat,
    addChat,
    clearError 
  } = useSidebar();

  // Expose addChat to parent component
  React.useEffect(() => {
    if (onAddChatReady) {
      onAddChatReady(addChat);
    }
  }, [onAddChatReady, addChat]);

  const handleChatSelect = async (chatId: string) => {
    const chat = await selectChat(chatId);
    if (chat) {
      onChatSelect(chatId);
    }
  };

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    if (newChat) {
      onNewChat();
      onChatSelect(newChat.id);
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
        ${isOpen ? 'w-80' : 'w-14'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header with Toggle Button */}
          <div className={`flex items-end ${isOpen ? 'justify-between pl-6 pr-0' : 'justify-center'} pt-4 pb-6`}>
            {isOpen ? (
              <>
                <div className="flex items-end gap-3">
                  <img 
                    src="/images/ai-icon.png" 
                    alt="AI" 
                    className="w-9 h-9 mb-1.5"
                  />
                  <span className="text-xl font-light text-gray-100 tracking-wider">AI Agent</span>
                </div>
                <button
                  onClick={onToggle}
                  className="p-2 pr-2 pb-0 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                  title="Close sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={onToggle}
                className="p-2 rounded-md hover:bg-gray-700 text-gray-100 hover:text-white transition-colors"
                title="Open sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* New Chat Button */}
          {isOpen ? (
            <div className="pb-10">
              <NewChatButton onClick={handleNewChat} />
            </div>
          ) : (
            <div className="pb-10 flex justify-center">
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
          )}

          {isOpen && (
            <>
              {/* Chats Title with Toggle */}
              <div className="pl-6 pr-3 py-2 flex items-center cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => setShowChatList(!showChatList)}>
                <h1 className="text-sm font-medium text-gray-300 tracking-wide">Chats</h1>
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
            </>
          )}
        </div>
      </div>
    </>
  );
};
