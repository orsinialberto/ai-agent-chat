import React, { useState } from 'react'

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([])
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputValue
    }
    
    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    
    // TODO: Send to backend API
    console.log('Sending message:', newMessage)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Interface</h2>
        
        {/* Messages Area */}
        <div className="space-y-4 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Start a conversation with the AI agent!</p>
              <p className="text-sm mt-2">Phase 1: Gemini Integration coming soon...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Input Area */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="input-field flex-1"
            disabled={true} // Disabled until backend is ready
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Backend integration coming in next phase...</p>
        </div>
      </div>
    </div>
  )
}
