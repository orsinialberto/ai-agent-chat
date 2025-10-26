import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ 
  onClick, 
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        w-full flex items-center justify-center px-4 py-2 
        text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/40 
        rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
      New Chat
    </button>
  );
};
