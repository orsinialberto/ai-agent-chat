import React, { useState, useEffect, useRef, Fragment } from 'react'
import { useChat } from '../hooks/useChat'
import { Message, Chat } from '../services/api'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useTranslation } from '../hooks/useTranslation'
import { TextArea } from './TextArea'
import { Listbox, Transition } from '@headlessui/react'

interface ChatInterfaceProps {
  currentChatId?: string;
  onChatCreated?: (chat: Chat) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentChatId, onChatCreated }) => {
  const [inputValue, setInputValue] = useState('')
  const [textAreaHeight, setTextAreaHeight] = useState<number>(40)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash')
  const availableModels = ['gemini-2.5-flash', 'gemini-2.5-pro']
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const notifiedChatIdsRef = useRef<Set<string>>(new Set())
  const { t } = useTranslation()
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
      // Mark this chat as already in sidebar (it was loaded, not created)
      if (currentChatId) {
        notifiedChatIdsRef.current.add(currentChatId);
      }
    }
  }, [currentChatId, currentChat?.id, loadChat])

  // Notify parent when a new chat is created (not loaded from currentChatId)
  useEffect(() => {
    if (currentChat && onChatCreated && !currentChatId && !notifiedChatIdsRef.current.has(currentChat.id)) {
      // This is a newly created chat (no currentChatId was provided and we haven't notified about it yet)
      onChatCreated(currentChat);
      notifiedChatIdsRef.current.add(currentChat.id);
    }
  }, [currentChat, currentChatId, onChatCreated])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const messageContent = inputValue.trim()
    setInputValue('')
    
    // If no chat exists, create one with the first message
    if (!currentChat) {
      await createChat({
        title: t('chat.new_chat'),
      initialMessage: messageContent,
      model: selectedModel
      })
    } else {
      // Send message to existing chat
    await sendMessage(messageContent, { model: selectedModel })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
            <p className="text-4xl font-light tracking-wide">All set when you are!</p>
          </div>
        </div>
      ) : (
        <div ref={messagesContainerRef} className="space-y-4 mb-3 flex-1 overflow-y-auto overflow-x-hidden min-h-0 max-h-[calc(100vh-16rem)] scrollbar-hide px-6 pt-6">
          {messages.map((message: Message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-lg break-words ${
                message.role === 'user' 
                  ? 'bg-sky-200/60 text-sky-800' 
                  : 'bg-gray-100 text-gray-700'
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
                <span className="text-sm">{t('chat.thinking')}</span>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      )}
        
        {/* Input Area */}
        <div
          className="px-6 mt-1"
        >
          <div
            className="aic-input-container"
            style={{
              // compute pill factor from height (min ~40px, max ~40vh)
              // clamp to [0,1]
              // @ts-ignore: CSS var inline
              '--pillFactor': (() => {
                const minH = 40
                const maxH = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.4) : 320
                const h = Math.max(minH, Math.min(textAreaHeight, maxH))
                const ratio = (maxH - h) / (maxH - minH)
                return Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 1))
              })()
            }}
          >
          <label htmlFor="chat-input" className="sr-only">
            {t('chat.type_message')}
          </label>
          <div className="relative">
            <TextArea
              id="chat-input"
              ariaLabelledBy={undefined}
              ariaLabel={t('chat.type_message')}
              value={inputValue}
              onChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.type_message')}
              disabled={isLoading}
              minRows={1}
              maxHeightVh={40}
              onHeightChange={setTextAreaHeight}
              className="aic-textarea--withSend"
            />
          {/* Model selector - bottom-left, accessible Listbox */}
          <div className="absolute left-3.5 bottom-3.5">
            <Listbox value={selectedModel} onChange={setSelectedModel}>
              <div className="relative text-xs">
                <Listbox.Button
                  className="px-2 py-1 text-gray-600 hover:text-gray-800 bg-transparent hover:bg-gray-50/30 focus:bg-white border-none outline-none rounded shadow-none inline-flex items-center gap-1"
                  aria-label={t('chat.model') ?? 'Model'}
                >
                  {selectedModel.replace('gemini-2.5-', 'gemini 2.5 ')}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="w-3.5 h-3.5 opacity-70"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.853a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options
                    className="absolute mt-1 max-h-60 w-max min-w-[10rem] overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none z-[60]"
                  >
                    {availableModels.map((model) => (
                      <Listbox.Option
                        key={model}
                        value={model}
                        className={({ active, selected }: { active: boolean; selected: boolean }) => `
                          cursor-pointer select-none px-3 py-1.5 rounded
                          ${active ? 'bg-sky-100/50 text-sky-800' : 'text-gray-700'}
                          ${selected ? 'font-medium' : 'font-normal'}
                        `}
                      >
                        {model.replace('gemini-2.5-', 'gemini 2.5 ')}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              type="button"
              aria-label={t('chat.send') ?? 'Invia'}
              title={t('chat.send') ?? 'Invia'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          </div>
        </div>
      </div>
  )
}
