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
        fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-50
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'w-80' : 'w-14'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header with Toggle Button */}
          <div className={`flex items-center ${isOpen ? 'justify-between pl-6 pr-3' : 'justify-center'} pt-4 pb-2`}>
            {isOpen ? (
              <>
                <span className="text-xs font-medium text-gray-400 tracking-wide">MENU</span>
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-100/60 text-gray-900 hover:text-gray-700 transition-colors"
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
                className="p-2 rounded-md hover:bg-gray-100/60 text-gray-900 hover:text-gray-700 transition-colors"
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
            <div className="pb-2">
              <NewChatButton onClick={handleNewChat} />
            </div>
          ) : (
            <div className="pb-2 flex justify-center">
              <button
                onClick={handleNewChat}
                className="p-2 rounded-md hover:bg-gray-100/60 text-gray-900 hover:text-gray-700 transition-colors"
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
              {/* Chats Title */}
              <div className="pl-6 pr-3 py-2">
                <h1 className="text-sm font-medium text-gray-600 tracking-wide">Chats</h1>
              </div>

              {/* Chat List */}
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
            </>
          )}
        </div>
      </div>
    </>
  );
};
