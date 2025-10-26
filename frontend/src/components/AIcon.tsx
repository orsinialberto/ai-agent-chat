import React from 'react';

interface AIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AIcon: React.FC<AIconProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div 
      className={`bg-sky-400 rounded-lg flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <span className="text-white font-bold">AI</span>
    </div>
  );
};
