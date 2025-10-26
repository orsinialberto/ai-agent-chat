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
    <div className="w-full min-w-0 min-h-0 max-h-[calc(100vh-8rem)] flex flex-col bg-white/90 rounded-lg">
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-rose-100/60 border-l-4 border-rose-300 text-rose-700 rounded-r-lg mx-6 mt-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <div className="text-center text-gray-600 py-4 mb-8">
            <p className="text-4xl font-light tracking-wide">Start a conversation</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-6 flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-[calc(100vh-16rem)] scrollbar-hide px-6 pt-6">
          {messages.map((message: Message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
                message.role === 'user' 
                  ? 'bg-sky-200/60 text-sky-800' 
                  : 'bg-gray-50 text-gray-600'
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
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}
        
        {/* Input Area */}
        <div className="flex space-x-3 px-6">
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
        
        <div className="mt-4 text-xs text-gray-400 text-center px-6 pb-6">
          <p>AI Agent Ready</p>
        </div>
      </div>
  )
}
