"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { StrategyJSON } from '@/lib/api/prophet'
import { BacktestResponse } from '@/lib/api/cartographe'
import { EducationalContent } from '@/lib/api/architect'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface Strategy {
  id: string | null
  userId: string | null
  name: string
  description: string
  tsdl: StrategyJSON

  // Conversation tracking for Prophet (persists conversation_id from backend)
  conversationId: string | null

  // Messages are ephemeral - not persisted to DB
  messages: ChatMessage[]

  createdAt: string | null
  updatedAt: string | null
}

export type DetailsPanelTab = 'library' | 'parameters' | 'code' | 'backtest' | 'live'

interface StrategyContextType {
  // Base strategy (saved version from DB)
  strategy: Strategy | null
  setStrategy: (strategy: Strategy | null) => void
  updateStrategy: (updates: Partial<Strategy>) => void
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  clearStrategy: () => Promise<void>

  // Edited strategy (working copy)
  editedStrategy: StrategyJSON | null
  editedName: string
  updateEditedStrategy: (updates: Partial<StrategyJSON>) => void
  setEditedName: (name: string) => void

  // Educational content (for library strategies)
  educationalContent: EducationalContent | null
  setEducationalContent: (content: EducationalContent | null) => void

  // Dirty state (auto-calculated)
  isDirty: boolean

  // Loading state for navigation
  isLoadingStrategy: boolean

  // Navigation helper
  navigateToCreate: (router: any) => Promise<boolean>

  // Prophet generation control
  registerStopProphet: (callback: () => void) => void

  backtestResults: BacktestResponse | null
  setBacktestResults: (results: BacktestResponse | null) => void
  isBacktesting: boolean
  setIsBacktesting: (value: boolean) => void

  isGeneratingStrategy: boolean
  setIsGeneratingStrategy: (value: boolean) => void
  strategyGenerationProgress: number
  setStrategyGenerationProgress: (value: number) => void
  progressStage: string
  setProgressStage: (stage: string) => void
  progressMessage: string
  setProgressMessage: (message: string) => void

  isChatExpanded: boolean
  expandChat: () => void
  collapseChat: () => void

  isDetailsPanelOpen: boolean
  detailsPanelTab: DetailsPanelTab
  openDetailsPanel: () => void
  closeDetailsPanel: () => void
  setDetailsPanelTab: (tab: DetailsPanelTab) => void
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined)

export function StrategyProvider({ children }: { children: ReactNode }) {
  // Base strategy (saved)
  const [strategy, setStrategyState] = useState<Strategy | null>(null)

  // Edited strategy (working copy)
  const [editedStrategy, setEditedStrategy] = useState<StrategyJSON | null>(null)
  const [editedName, setEditedName] = useState('')

  // Educational content (library strategies)
  const [educationalContent, setEducationalContent] = useState<EducationalContent | null>(null)

  // Dirty state
  const [isDirty, setIsDirty] = useState(false)

  // Loading state for navigation
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false)

  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)
  const [isBacktesting, setIsBacktesting] = useState(false)

  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  const [strategyGenerationProgress, setStrategyGenerationProgress] = useState(0)
  const [progressStage, setProgressStage] = useState<string>('')
  const [progressMessage, setProgressMessage] = useState<string>('')

  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const [detailsPanelTab, setDetailsPanelTab] = useState<DetailsPanelTab>('parameters')

  // Ref to Prophet stopGeneration callback
  const stopProphetRef = useRef<(() => void) | null>(null)

  // Wrapped setStrategy with loading state management
  const setStrategy = (newStrategy: Strategy | null) => {
    setStrategyState(newStrategy)
    setIsLoadingStrategy(false)
  }

  // Register Prophet stop callback
  const registerStopProphet = (callback: () => void) => {
    stopProphetRef.current = callback
  }

  // Sync editedStrategy with strategy when strategy changes
  useEffect(() => {
    if (strategy) {
      setEditedStrategy(strategy.tsdl)
      setEditedName(strategy.name)
    } else {
      setEditedStrategy(null)
      setEditedName('')
    }
  }, [strategy?.id, strategy?.tsdl, strategy?.name])

  // Auto-calculate dirty state
  useEffect(() => {
    if (!strategy || !editedStrategy) {
      setIsDirty(false)
      return
    }

    // New strategy (not saved yet) - always dirty
    if (strategy.id === null) {
      setIsDirty(true)
      return
    }

    // Existing strategy - check for changes
    const hasChanges =
      editedName !== strategy.name ||
      JSON.stringify(editedStrategy) !== JSON.stringify(strategy.tsdl)

    setIsDirty(hasChanges)
  }, [editedName, editedStrategy, strategy])

  // Clear backtest results when editedStrategy changes (user edits or new strategy from Prophet)
  useEffect(() => {
    setBacktestResults(null)
  }, [editedStrategy])

  const updateStrategy = (updates: Partial<Strategy>) => {
    setStrategyState(prev => prev ? { ...prev, ...updates } : null)
  }

  // Add a message to the conversation
  const addMessage = (message: ChatMessage) => {
    setStrategyState(prev =>
      prev
        ? { ...prev, messages: [...prev.messages, message] }
        : null
    )
  }

  // Update the last message (for streaming)
  const updateLastMessage = (content: string) => {
    setStrategyState(prev => {
      if (!prev || prev.messages.length === 0) return prev
      const messages = [...prev.messages]
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content
      }
      return { ...prev, messages }
    })
  }

  // Clear all messages
  const clearMessages = () => {
    setStrategyState(prev =>
      prev
        ? { ...prev, messages: [] }
        : null
    )
  }

  const updateEditedStrategy = (updates: Partial<StrategyJSON>) => {
    setEditedStrategy(prev => prev ? { ...prev, ...updates } : null)
  }

  const clearStrategy = async () => {
    // Set loading state FIRST
    setIsLoadingStrategy(true)

    // CRITICAL: Stop Prophet generation
    if (stopProphetRef.current) {
      stopProphetRef.current()
    }

    // Clear everything (conversation_id will be reset - Prophet starts new conversation)
    setStrategyState(null)
    setEditedStrategy(null)
    setEditedName('')
    setEducationalContent(null)
    setIsDirty(false)
    setBacktestResults(null)
    setIsBacktesting(false)
    setIsGeneratingStrategy(false)
    setStrategyGenerationProgress(0)
    setProgressStage('')
    setProgressMessage('')
    setDetailsPanelTab('parameters')
  }

  // Navigation helper - checks for unsaved changes before navigating
  const navigateToCreate = async (router: any): Promise<boolean> => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmed) {
        return false
      }
    }

    // Clear strategy
    await clearStrategy()

    // CRITICAL: setStrategy(null) clears isLoadingStrategy immediately
    // This prevents infinite spinner if router.push doesn't trigger navigation
    setStrategy(null)

    // Close details panel when going to EmptyState
    setIsDetailsPanelOpen(false)

    // Navigate
    router.push('/create')
    return true
  }

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)
  const openDetailsPanel = () => setIsDetailsPanelOpen(true)
  const closeDetailsPanel = () => setIsDetailsPanelOpen(false)

  return (
    <StrategyContext.Provider
      value={{
        strategy,
        setStrategy,
        updateStrategy,
        addMessage,
        updateLastMessage,
        clearMessages,
        clearStrategy,
        editedStrategy,
        editedName,
        updateEditedStrategy,
        setEditedName,
        educationalContent,
        setEducationalContent,
        isDirty,
        isLoadingStrategy,
        navigateToCreate,
        registerStopProphet,
        backtestResults,
        setBacktestResults,
        isBacktesting,
        setIsBacktesting,
        isGeneratingStrategy,
        setIsGeneratingStrategy,
        strategyGenerationProgress,
        setStrategyGenerationProgress,
        progressStage,
        setProgressStage,
        progressMessage,
        setProgressMessage,
        isChatExpanded,
        expandChat,
        collapseChat,
        isDetailsPanelOpen,
        detailsPanelTab,
        openDetailsPanel,
        closeDetailsPanel,
        setDetailsPanelTab,
      }}
    >
      {children}
    </StrategyContext.Provider>
  )
}

export function useStrategy() {
  const context = useContext(StrategyContext)
  if (context === undefined) {
    throw new Error('useStrategy must be used within StrategyProvider')
  }
  return context
}

export { StrategyContext }
