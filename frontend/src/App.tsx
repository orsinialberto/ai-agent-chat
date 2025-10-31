import { useState, useRef } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/sidebar'
import { Chat } from './services/api'

function App() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const addChatToSidebarRef = useRef<((chat: Chat) => void) | null>(null)

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
  }

  const handleAddChatReady = (addChat: (chat: Chat) => void) => {
    addChatToSidebarRef.current = addChat
  }

  return (
    <div className="h-screen bg-white overflow-hidden">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onAddChatReady={handleAddChatReady}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Content - Centered */}
        <main className="flex-1 overflow-hidden flex justify-center items-center py-6">
          <div className="w-full max-w-4xl px-4">
            <ChatInterface 
              currentChatId={currentChatId} 
              onChatCreated={(chat) => {
                if (addChatToSidebarRef.current) {
                  addChatToSidebarRef.current(chat)
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
