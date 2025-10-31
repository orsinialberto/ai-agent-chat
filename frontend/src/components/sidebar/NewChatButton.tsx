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
        w-full flex items-center justify-start pl-6 pr-6 py-2 
        text-sm text-gray-100 hover:text-white hover:bg-gray-700 
        rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <svg 
        className="w-5 h-5 mr-2" 
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
