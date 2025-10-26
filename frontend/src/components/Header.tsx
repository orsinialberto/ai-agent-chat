import React from 'react'
import { AIcon } from './AIcon'

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-100 w-full relative z-50">
      <div className="w-full px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <AIcon size="md" />
            <h1 className="text-xl font-semibold text-gray-900">AI Agent Chat</h1>
          </div>
        </div>
      </div>
    </header>
  )
}
