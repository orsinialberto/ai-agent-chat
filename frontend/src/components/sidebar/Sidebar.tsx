import React from 'react';
import { ChatList } from './ChatList';
import { useSidebar } from '../../hooks/useSidebar';

interface SidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentChatId, 
  onChatSelect, 
  onNewChat,
  isOpen = false,
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
    clearError 
  } = useSidebar();

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
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Chats Title with New Chat Button */}
          <div className="px-3 py-2 flex items-center justify-between">
            <h1 className="text-sm font-medium text-gray-600 tracking-wide">Chats</h1>
            <button
              onClick={handleNewChat}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded transition-colors"
              title="New Chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
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

          {/* Sidebar Header - Only Close Button */}
          <div className="flex items-center justify-end p-4">
            {onToggle && (
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-md hover:bg-peach-100/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
