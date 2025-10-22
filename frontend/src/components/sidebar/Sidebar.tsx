import React from 'react';
import { ChatList } from './ChatList';
import { NewChatButton } from './NewChatButton';
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
        fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
            {onToggle && (
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-200">
            <NewChatButton onClick={handleNewChat} />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
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
        </div>
      </div>
    </>
  );
};
