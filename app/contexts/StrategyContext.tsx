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
  // Base strategy (saved version from DB)
  strategy: Strategy | null
  setStrategy: (strategy: Strategy | null) => void
  updateStrategy: (updates: Partial<Strategy>) => void
  updateConversation: (updates: Partial<Strategy['conversation']>) => void
  clearStrategy: () => void

  // Edited strategy (working copy)
  editedStrategy: StrategyJSON | null
  editedName: string
  updateEditedStrategy: (updates: Partial<StrategyJSON>) => void
  setEditedName: (name: string) => void

  // Dirty state (auto-calculated)
  isDirty: boolean

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
  // Base strategy (saved)
  const [strategy, setStrategy] = useState<Strategy | null>(null)

  // Edited strategy (working copy)
  const [editedStrategy, setEditedStrategy] = useState<StrategyJSON | null>(null)
  const [editedName, setEditedName] = useState('')

  // Dirty state
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
    setStrategy(prev => prev ? { ...prev, ...updates } : null)
  }

  const updateConversation = (updates: Partial<Strategy['conversation']>) => {
    setStrategy(prev =>
      prev
        ? { ...prev, conversation: { ...prev.conversation, ...updates } }
        : null
    )
  }

  const updateEditedStrategy = (updates: Partial<StrategyJSON>) => {
    setEditedStrategy(prev => prev ? { ...prev, ...updates } : null)
  }

  const clearStrategy = () => {
    setStrategy(null)
    setEditedStrategy(null)
    setEditedName('')
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
        editedStrategy,
        editedName,
        updateEditedStrategy,
        setEditedName,
        isDirty,
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
