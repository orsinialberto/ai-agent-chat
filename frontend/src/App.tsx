import { useState } from 'react'
import { Header } from './components/Header'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/sidebar'

function App() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <Sidebar 
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Content - Centered */}
        <main className="flex-1 overflow-hidden flex justify-center items-center py-6">
          <div className="w-full max-w-4xl px-4">
            <ChatInterface currentChatId={currentChatId} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
