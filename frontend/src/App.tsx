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
        
        {/* Main Content - Simplified */}
        <main className="flex-1 p-6 overflow-hidden">
          <ChatInterface currentChatId={currentChatId} />
        </main>
      </div>
    </div>
  )
}

export default App
