"use client"
import { createContext, useContext, useState, ReactNode } from 'react'
import { StrategyMetadata } from '@/lib/api/prophet'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface CurrentStrategy {
  id: string
  name: string
  tsdl_code: string
  updated_at?: string
}

interface ChatContextType {
  isChatExpanded: boolean
  generatedStrategy: any | null
  strategyMetadata: StrategyMetadata | null
  currentStrategy: CurrentStrategy | null
  inputValue: string
  messages: ChatMessage[]
  conversationId: string | null
  conversationState: string
  isGeneratingStrategy: boolean
  strategyGenerationProgress: number
  expandChat: () => void
  collapseChat: () => void
  setGeneratedStrategy: (strategy: any) => void
  setStrategyMetadata: (metadata: StrategyMetadata | null) => void
  setCurrentStrategy: (strategy: CurrentStrategy | null) => void
  setInputValue: (value: string) => void
  setMessages: (messages: ChatMessage[]) => void
  setConversationId: (id: string | null) => void
  setConversationState: (state: string) => void
  setIsGeneratingStrategy: (value: boolean) => void
  setStrategyGenerationProgress: (value: number) => void
  clearChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [strategyMetadata, setStrategyMetadata] = useState<StrategyMetadata | null>(null)
  const [currentStrategy, setCurrentStrategy] = useState<CurrentStrategy | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationState, setConversationState] = useState<string>('greeting')
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  const [strategyGenerationProgress, setStrategyGenerationProgress] = useState(0)

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)

  const clearChat = () => {
    setMessages([])
    setConversationId(null)
    setConversationState('greeting')
    setGeneratedStrategy(null)
    setStrategyMetadata(null)
    setCurrentStrategy(null)
    setInputValue("")
    setIsGeneratingStrategy(false)
    setStrategyGenerationProgress(0)
  }

  return (
    <ChatContext.Provider
      value={{
        isChatExpanded,
        generatedStrategy,
        strategyMetadata,
        currentStrategy,
        inputValue,
        messages,
        conversationId,
        conversationState,
        isGeneratingStrategy,
        strategyGenerationProgress,
        expandChat,
        collapseChat,
        setGeneratedStrategy,
        setStrategyMetadata,
        setCurrentStrategy,
        setInputValue,
        setMessages,
        setConversationId,
        setConversationState,
        setIsGeneratingStrategy,
        setStrategyGenerationProgress,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
