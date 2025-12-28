"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { StrategyJSON } from '@/lib/api/prophet'
import { BacktestResponse } from '@/lib/api/cartographe'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface Strategy {
  id: string | null
  name: string
  description: string
  tsdl: StrategyJSON
  status: 'draft' | 'active' | 'paused' | 'archived'
  basePlugins: string[]
  version: string

  conversation: {
    id: string | null
    messages: ChatMessage[]
  }

  createdAt: string | null
  updatedAt: string | null
}

export type DetailsPanelTab = 'parameters' | 'code' | 'backtest'

interface StrategyContextType {
  strategy: Strategy | null
  setStrategy: (strategy: Strategy | null) => void
  updateStrategy: (updates: Partial<Strategy>) => void
  updateConversation: (updates: Partial<Strategy['conversation']>) => void
  clearStrategy: () => void

  // Dirty state tracking (simplified)
  isDirty: boolean
  setDirty: (isDirty: boolean) => void

  // Navigation helper
  navigateToCreate: (router: any) => boolean

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

  isParametersFullscreen: boolean
  expandParametersFullscreen: () => void
  collapseParametersFullscreen: () => void
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined)

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)
  const [isBacktesting, setIsBacktesting] = useState(false)

  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  const [strategyGenerationProgress, setStrategyGenerationProgress] = useState(0)
  const [progressStage, setProgressStage] = useState<string>('')
  const [progressMessage, setProgressMessage] = useState<string>('')

  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const [detailsPanelTab, setDetailsPanelTab] = useState<DetailsPanelTab>('parameters')
  const [isParametersFullscreen, setIsParametersFullscreen] = useState(false)

  // Auto-clear backtest results when strategy changes
  useEffect(() => {
    setBacktestResults(null)
  }, [strategy?.id, strategy?.name])

  const updateStrategy = (updates: Partial<Strategy>) => {
    setStrategy(prev => prev ? { ...prev, ...updates } : null)
  }

  const updateConversation = (updates: Partial<Strategy['conversation']>) => {
    setStrategy(prev =>
      prev
        ? { ...prev, conversation: { ...prev.conversation, ...updates } }
        : null
    )
  }

  const setDirty = (dirty: boolean) => {
    setIsDirty(dirty)
  }

  const clearStrategy = () => {
    setStrategy(null)
    setIsDirty(false)
    setBacktestResults(null)
    setIsBacktesting(false)
    setIsGeneratingStrategy(false)
    setStrategyGenerationProgress(0)
    setProgressStage('')
    setProgressMessage('')
    setIsDetailsPanelOpen(false)
    setDetailsPanelTab('parameters')
    setIsParametersFullscreen(false)
  }

  // Navigation helper - checks for unsaved changes before navigating
  const navigateToCreate = (router: any): boolean => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmed) {
        return false
      }
    }

    // Clear strategy and navigate
    clearStrategy()
    router.push('/create')
    return true
  }

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)
  const openDetailsPanel = () => setIsDetailsPanelOpen(true)
  const closeDetailsPanel = () => {
    setIsDetailsPanelOpen(false)
    setIsParametersFullscreen(false)
  }
  const expandParametersFullscreen = () => setIsParametersFullscreen(true)
  const collapseParametersFullscreen = () => setIsParametersFullscreen(false)

  return (
    <StrategyContext.Provider
      value={{
        strategy,
        setStrategy,
        updateStrategy,
        updateConversation,
        clearStrategy,
        isDirty,
        setDirty,
        navigateToCreate,
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
        isParametersFullscreen,
        expandParametersFullscreen,
        collapseParametersFullscreen,
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
