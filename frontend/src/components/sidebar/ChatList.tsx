import React from 'react';
import { Chat } from '../../services/api';
import { ChatItem } from './ChatItem';

interface ChatListProps {
  chats: Chat[];
  currentChatId?: string;
  isLoading: boolean;
  error: string | null;
  onChatSelect: (chatId: string) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClearError: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  currentChatId,
  isLoading,
  error,
  onChatSelect,
  onUpdateTitle,
  onDeleteChat,
  onClearError
}) => {
  if (error) {
    return (
      <div className="pl-6 pr-3 py-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button 
              onClick={onClearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pl-6 pr-3 py-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading chats...</span>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="pl-6 pr-3 py-4">
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">No chats yet</p>
          <p className="text-xs mt-1">Create your first chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === currentChatId}
            onSelect={() => onChatSelect(chat.id)}
            onUpdateTitle={(title) => onUpdateTitle(chat.id, title)}
            onDelete={() => onDeleteChat(chat.id)}
          />
        ))}
      </div>
    </div>
  );
};
