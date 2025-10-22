import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">AI Agent Chat</h1>
          </div>
          <div className="text-sm text-gray-500">
            Phase 1: Gemini Integration
          </div>
        </div>
      </div>
    </header>
  )
}
