import React, { useState } from 'react';
import { Chat } from '../../services/api';
import { DeleteChatModal } from './DeleteChatModal';

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  onSelect,
  onUpdateTitle,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle.trim() !== chat.title) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(chat.title || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffInHours = (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return chatDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessage = () => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      return lastMessage.content.length > 50 
        ? lastMessage.content.substring(0, 50) + '...'
        : lastMessage.content;
    }
    return 'No messages yet';
  };

  return (
    <>
      <div
        className={`
          group relative pl-6 pr-3 py-3 rounded-lg cursor-pointer transition-colors
          ${isActive 
            ? 'bg-sky-100/50 border border-sky-200/60' 
            : 'hover:bg-sky-50/40'
          }
        `}
        onClick={onSelect}
      >
        {isEditing ? (
          <form onSubmit={handleTitleSubmit} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleTitleSubmit}
              className="w-full text-sm font-medium bg-transparent border-none outline-none"
              autoFocus
            />
          </form>
        ) : (
          <>
            {/* Title and timestamp row */}
            <div className="flex items-center justify-between mb-1">
              <h3 className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-sky-800' : 'text-gray-900'}`}>
                {chat.title || 'Untitled Chat'}
              </h3>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDate(chat.updatedAt)}
              </span>
            </div>
            
            {/* Last message and action buttons row */}
            <div className="flex items-center justify-between">
              <p className={`text-xs truncate flex-1 ${isActive ? 'text-sky-700' : 'text-gray-500'}`}>
                {getLastMessage()}
              </p>
              
              {/* Action buttons aligned with message preview */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 ml-13">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1 rounded hover:bg-peach-100/60 text-gray-500 hover:text-gray-700"
                  title="Rename chat"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="p-1 rounded hover:bg-rose-100/60 text-gray-500 hover:text-rose-600"
                  title="Delete chat"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteChatModal
        isOpen={showDeleteModal}
        chatTitle={chat.title || 'Untitled Chat'}
        onConfirm={() => {
          onDelete();
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};
