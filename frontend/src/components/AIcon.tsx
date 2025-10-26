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
    sm: 'w-14 h-14',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <img 
      src="/images/ai-icon.png" 
      alt="AI" 
      className={`${sizeClasses[size]} ${className}`}
      style={{ marginTop: '-8px', marginBottom: '-8px' }}
    />
  );
};
