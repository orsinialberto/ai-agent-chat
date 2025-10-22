import React from 'react'
import { Header } from './components/Header'
import { ChatInterface } from './components/ChatInterface'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ChatInterface />
      </main>
    </div>
  )
}

export default App
