import React, { useState, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import { Message } from '../services/api'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ChatInterfaceProps {
  currentChatId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentChatId }) => {
  const [inputValue, setInputValue] = useState('')
  const { 
    currentChat, 
    messages, 
    isLoading, 
    error, 
    createChat, 
    loadChat,
    sendMessage, 
    clearError 
  } = useChat()

  // Load chat when currentChatId changes
  useEffect(() => {
    if (currentChatId && currentChatId !== currentChat?.id) {
      loadChat(currentChatId);
    }
  }, [currentChatId, currentChat?.id, loadChat])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const messageContent = inputValue.trim()
    setInputValue('')
    
    // If no chat exists, create one with the first message
    if (!currentChat) {
      await createChat({
        title: 'New Chat',
        initialMessage: messageContent
      })
    } else {
      // Send message to existing chat
      await sendMessage(messageContent)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="w-full min-w-0 h-full max-h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-w-0 h-full max-h-full flex flex-col">
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="space-y-4 mb-6 flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Start a conversation</p>
            </div>
          ) : (
            messages.map((message: Message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end mr-4' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer 
                      content={message.content} 
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="input-field flex-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>AI Agent Ready</p>
        </div>
      </div>
    </div>
  )
}
