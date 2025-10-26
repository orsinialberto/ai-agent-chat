import React, { useEffect } from 'react';

interface DeleteChatModalProps {
  isOpen: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  isOpen,
  chatTitle,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg 
                className="w-6 h-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Chat
              </h3>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete <strong>"{chatTitle}"</strong>? 
              This action cannot be undone and will permanently remove all messages in this chat.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="
                px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors duration-200
              "
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="
                px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                transition-colors duration-200
              "
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
