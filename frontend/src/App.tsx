import { useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/sidebar'
import { Settings } from './components/Settings'
import { Chat } from './services/api'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage, RegisterPage, ProtectedRoute } from './components/auth'

/**
 * Main App Component (protected)
 * Contains the sidebar and main content (chat or settings)
 */
function MainApp() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const addChatToSidebarRef = useRef<((chat: Chat) => void) | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    // Navigate to home if we're on settings page
    if (location.pathname === '/settings') {
      navigate('/')
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    // Navigate to home if we're on settings page
    if (location.pathname === '/settings') {
      navigate('/')
    }
  }

  const handleAddChatReady = (addChat: (chat: Chat) => void) => {
    addChatToSidebarRef.current = addChat
  }

  const isSettingsPage = location.pathname === '/settings'

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
            {isSettingsPage ? (
              <Settings />
            ) : (
              <ChatInterface 
                currentChatId={currentChatId} 
                onChatCreated={(chat) => {
                  if (addChatToSidebarRef.current) {
                    addChatToSidebarRef.current(chat)
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Root App Component
 * Provides routing and authentication context
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
