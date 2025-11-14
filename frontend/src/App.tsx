import { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ChatInterface } from './components/ChatInterface'
import { Sidebar } from './components/sidebar'
import { Settings } from './components/Settings'
import { Chat } from './services/api'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { LoginPage, RegisterPage, ProtectedRoute } from './components/auth'
import { LoginDialog } from './components/auth/LoginDialog'
import { RegisterDialog } from './components/auth/RegisterDialog'

function ThemeFloatingToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      onClick={toggleTheme}
      title={label}
      aria-pressed={theme === 'dark'}
      className="fixed top-6 right-6 z-[60] rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700 transition-colors"
    >
      {theme === 'dark' ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Light
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Dark
        </span>
      )}
    </button>
  )
}

/**
 * Main App Component
 * Contains the sidebar and main content (chat or settings)
 * Works for both anonymous and authenticated users
 */
function MainApp() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [resetKey, setResetKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const addChatToSidebarRef = useRef<((chat: Chat) => void) | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  // Close dialogs when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (loginDialogOpen) {
        setLoginDialogOpen(false)
      }
      if (registerDialogOpen) {
        setRegisterDialogOpen(false)
      }
    }
  }, [isAuthenticated, loginDialogOpen, registerDialogOpen])

  // Reset currentChatId when navigating to settings page
  useEffect(() => {
    if (location.pathname === '/settings') {
      setCurrentChatId(undefined)
    }
  }, [location.pathname])

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

  const handleHomeClick = () => {
    // Force reset: clear current chat and navigate to home
    setCurrentChatId(undefined)
    // Increment resetKey to force ChatInterface to reset even if we're already on home
    setResetKey(prev => prev + 1)
    // Navigate to home if we're not already there
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleAddChatReady = (addChat: (chat: Chat) => void) => {
    addChatToSidebarRef.current = addChat
  }

  const isSettingsPage = location.pathname === '/settings'

  return (
    <div className="h-screen bg-white dark:bg-gray-900 overflow-hidden transition-colors">
      <ThemeFloatingToggle />
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onAddChatReady={handleAddChatReady}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isAnonymous={!isAuthenticated}
          onLoginClick={() => setLoginDialogOpen(true)}
          onHomeClick={handleHomeClick}
        />
        
        {/* Main Content - Centered */}
        <main className="flex-1 overflow-hidden flex justify-center items-center py-6">
          <div className="w-full max-w-4xl px-4">
            {isSettingsPage ? (
              <Settings />
            ) : (
              <ChatInterface 
                key={resetKey}
                currentChatId={currentChatId} 
                onChatCreated={(chat) => {
                  if (addChatToSidebarRef.current) {
                    addChatToSidebarRef.current(chat)
                  }
                }}
                isAnonymous={!isAuthenticated}
              />
            )}
          </div>
        </main>
      </div>
      
      {/* Login Dialog */}
      <LoginDialog 
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSwitchToRegister={() => {
          setLoginDialogOpen(false)
          setRegisterDialogOpen(true)
        }}
      />
      
      {/* Register Dialog */}
      <RegisterDialog 
        isOpen={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        onSwitchToLogin={() => {
          setRegisterDialogOpen(false)
          setLoginDialogOpen(true)
        }}
      />
    </div>
  )
}

/**
 * Root App Component
 * Provides routing and authentication context
 */
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Chat route - accessible to both anonymous and authenticated users */}
          <Route
            path="/"
            element={<MainApp />}
          />
          
          {/* Settings route - protected (requires authentication) */}
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
    </ThemeProvider>
  )
}

export default App
