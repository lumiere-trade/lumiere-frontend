"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { StrategyJSON } from '@/lib/api/prophet'
import { BacktestResponse } from '@/lib/api/cartographe'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  hasStrategy?: boolean
}

export interface GeneratedStrategy {
  id: string
  name: string
  strategy_json: StrategyJSON
  python_code: string
  strategy_class_name: string
}

export interface CurrentStrategy {
  id: string
  name: string
  tsdl_code: string
  updated_at?: string
}

export type DetailsPanelTab = 'parameters' | 'code' | 'backtest'

interface ChatContextType {
  isChatExpanded: boolean
  generatedStrategy: GeneratedStrategy | null
  strategyMetadata: StrategyJSON | null
  currentStrategy: CurrentStrategy | null
  inputValue: string
  messages: ChatMessage[]
  conversationId: string | null
  conversationState: string
  isGeneratingStrategy: boolean
  strategyGenerationProgress: number
  progressStage: string
  progressMessage: string
  isDetailsPanelOpen: boolean
  detailsPanelTab: DetailsPanelTab
  backtestResults: BacktestResponse | null
  isBacktesting: boolean
  isParametersFullscreen: boolean

  expandChat: () => void
  collapseChat: () => void
  setGeneratedStrategy: (strategy: GeneratedStrategy | null) => void
  setStrategyMetadata: (metadata: StrategyJSON | null) => void
  setCurrentStrategy: (strategy: CurrentStrategy | null) => void
  setInputValue: (value: string) => void
  setMessages: (messages: ChatMessage[]) => void
  setConversationId: (id: string | null) => void
  setConversationState: (state: string) => void
  setIsGeneratingStrategy: (value: boolean) => void
  setStrategyGenerationProgress: (value: number) => void
  setProgressStage: (stage: string) => void
  setProgressMessage: (message: string) => void
  openDetailsPanel: () => void
  closeDetailsPanel: () => void
  setDetailsPanelTab: (tab: DetailsPanelTab) => void
  setBacktestResults: (results: BacktestResponse | null) => void
  setIsBacktesting: (value: boolean) => void
  expandParametersFullscreen: () => void
  collapseParametersFullscreen: () => void
  clearChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null)
  const [strategyMetadata, setStrategyMetadata] = useState<StrategyJSON | null>(null)
  const [currentStrategy, setCurrentStrategy] = useState<CurrentStrategy | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationState, setConversationState] = useState<string>('greeting')
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  const [strategyGenerationProgress, setStrategyGenerationProgress] = useState(0)
  const [progressStage, setProgressStage] = useState<string>('')
  const [progressMessage, setProgressMessage] = useState<string>('')
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const [detailsPanelTab, setDetailsPanelTab] = useState<DetailsPanelTab>('parameters')
  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [isParametersFullscreen, setIsParametersFullscreen] = useState(false)

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)
  const openDetailsPanel = () => setIsDetailsPanelOpen(true)
  const closeDetailsPanel = () => {
    setIsDetailsPanelOpen(false)
    setIsParametersFullscreen(false)
  }
  const expandParametersFullscreen = () => setIsParametersFullscreen(true)
  const collapseParametersFullscreen = () => setIsParametersFullscreen(false)

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
    setProgressStage('')
    setProgressMessage('')
    setIsDetailsPanelOpen(false)
    setDetailsPanelTab('parameters')
    setBacktestResults(null)
    setIsBacktesting(false)
    setIsParametersFullscreen(false)
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
        progressStage,
        progressMessage,
        isDetailsPanelOpen,
        detailsPanelTab,
        backtestResults,
        isBacktesting,
        isParametersFullscreen,
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
        setProgressStage,
        setProgressMessage,
        openDetailsPanel,
        closeDetailsPanel,
        setDetailsPanelTab,
        setBacktestResults,
        setIsBacktesting,
        expandParametersFullscreen,
        collapseParametersFullscreen,
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
