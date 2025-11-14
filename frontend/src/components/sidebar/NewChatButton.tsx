import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'full' | 'pill';
  className?: string;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ 
  onClick, 
  disabled = false,
  variant = 'full',
  className = ''
}) => {
  const baseClasses =
    variant === 'pill'
      ? 'inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition-colors duration-200'
      : 'w-full flex items-center justify-start pl-4 pr-6 pt-4 pb-2 text-base text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="New Chat"
      className={`
        ${baseClasses}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <svg 
        className={`w-5 h-5 ${variant === 'pill' ? '' : 'mr-2'}`} 
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
      <span className={variant === 'pill' ? 'font-medium' : ''}>New Chat</span>
    </button>
  );
};
