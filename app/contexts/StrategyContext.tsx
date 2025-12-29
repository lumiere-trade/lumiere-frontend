"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { StrategyJSON } from '@/lib/api/prophet'
import { BacktestResponse } from '@/lib/api/cartographe'
import { createConversation } from '@/lib/api/architect'

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
  clearStrategy: () => Promise<void>

  // Edited strategy (working copy)
  editedStrategy: StrategyJSON | null
  editedName: string
  updateEditedStrategy: (updates: Partial<StrategyJSON>) => void
  setEditedName: (name: string) => void

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

  isParametersFullscreen: boolean
  expandParametersFullscreen: () => void
  collapseParametersFullscreen: () => void
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined)

export function StrategyProvider({ children }: { children: ReactNode }) {
  // Base strategy (saved)
  const [strategy, setStrategyState] = useState<Strategy | null>(null)

  // Edited strategy (working copy)
  const [editedStrategy, setEditedStrategy] = useState<StrategyJSON | null>(null)
  const [editedName, setEditedName] = useState('')

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
  const [isParametersFullscreen, setIsParametersFullscreen] = useState(false)

  // Ref to Prophet stopGeneration callback
  const stopProphetRef = useRef<(() => void) | null>(null)

  // Wrapped setStrategy with logging and loading state management
  const setStrategy = (newStrategy: Strategy | null) => {
    console.log('🔵 [StrategyContext] setStrategy called', {
      from: strategy?.id || 'null',
      to: newStrategy?.id || 'null',
      fromName: strategy?.name || 'null',
      toName: newStrategy?.name || 'null',
      messageCount: newStrategy?.conversation.messages.length || 0,
      timestamp: new Date().toISOString()
    })
    setStrategyState(newStrategy)
    setIsLoadingStrategy(false)
  }

  // Register Prophet stop callback
  const registerStopProphet = (callback: () => void) => {
    console.log('🟢 [StrategyContext] Registered Prophet stop callback')
    stopProphetRef.current = callback
  }

  // Sync editedStrategy with strategy when strategy changes
  useEffect(() => {
    console.log('🟡 [StrategyContext] Syncing editedStrategy from strategy', {
      strategyId: strategy?.id,
      strategyName: strategy?.name,
      hasStrategy: !!strategy,
      timestamp: new Date().toISOString()
    })

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

    console.log('🟣 [StrategyContext] Dirty state calculated', {
      isDirty: hasChanges,
      strategyId: strategy.id,
      nameChanged: editedName !== strategy.name,
      tsdlChanged: JSON.stringify(editedStrategy) !== JSON.stringify(strategy.tsdl),
      timestamp: new Date().toISOString()
    })

    setIsDirty(hasChanges)
  }, [editedName, editedStrategy, strategy])

  // Clear backtest results when editedStrategy changes (user edits or new strategy from Prophet)
  useEffect(() => {
    setBacktestResults(null)
  }, [editedStrategy])

  const updateStrategy = (updates: Partial<Strategy>) => {
    console.log('🔵 [StrategyContext] updateStrategy', { updates, timestamp: new Date().toISOString() })
    setStrategyState(prev => prev ? { ...prev, ...updates } : null)
  }

  const updateConversation = (updates: Partial<Strategy['conversation']>) => {
    console.log('🔵 [StrategyContext] updateConversation', {
      updates,
      currentMessageCount: strategy?.conversation.messages.length || 0,
      timestamp: new Date().toISOString()
    })
    setStrategyState(prev =>
      prev
        ? { ...prev, conversation: { ...prev.conversation, ...updates } }
        : null
    )
  }

  const updateEditedStrategy = (updates: Partial<StrategyJSON>) => {
    console.log('🟢 [StrategyContext] updateEditedStrategy', { updates, timestamp: new Date().toISOString() })
    setEditedStrategy(prev => prev ? { ...prev, ...updates } : null)
  }

  // Auto-save conversation before navigation (only for saved strategies)
  const saveConversationBeforeNavigate = async () => {
    console.log('🟠 [StrategyContext] saveConversationBeforeNavigate START', {
      hasStrategyId: !!strategy?.id,
      strategyId: strategy?.id,
      messageCount: strategy?.conversation.messages.length || 0,
      timestamp: new Date().toISOString()
    })

    if (!strategy?.id || !strategy.conversation.messages.length) {
      console.log('⚪ [StrategyContext] saveConversationBeforeNavigate SKIP - no ID or messages')
      return
    }

    try {
      await createConversation({
        strategy_id: strategy.id,
        messages: strategy.conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))
      })
      console.log('✅ [StrategyContext] saveConversationBeforeNavigate SUCCESS', {
        strategyId: strategy.id,
        messagesSaved: strategy.conversation.messages.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [StrategyContext] saveConversationBeforeNavigate FAILED', {
        error,
        strategyId: strategy.id,
        timestamp: new Date().toISOString()
      })
      // Don't block navigation on error
    }
  }

  const clearStrategy = async () => {
    console.log('🔴 [StrategyContext] clearStrategy START', {
      currentStrategyId: strategy?.id,
      currentStrategyName: strategy?.name,
      messageCount: strategy?.conversation.messages.length || 0,
      isDirty,
      timestamp: new Date().toISOString()
    })

    // Set loading state FIRST
    setIsLoadingStrategy(true)

    // CRITICAL: Stop Prophet generation
    if (stopProphetRef.current) {
      console.log('🛑 [StrategyContext] Stopping Prophet generation')
      stopProphetRef.current()
    }

    // Auto-save conversation before clearing (only if strategy has ID)
    await saveConversationBeforeNavigate()

    // Then clear everything
    console.log('🔴 [StrategyContext] clearStrategy - clearing all state', {
      timestamp: new Date().toISOString()
    })

    setStrategyState(null)
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
    
    // CRITICAL: Clear loading state at the end
    setIsLoadingStrategy(false)

    console.log('✅ [StrategyContext] clearStrategy COMPLETE', {
      timestamp: new Date().toISOString()
    })
  }

  // Navigation helper - checks for unsaved changes before navigating
  const navigateToCreate = async (router: any): Promise<boolean> => {
    console.log('🔵 [StrategyContext] navigateToCreate', {
      isDirty,
      timestamp: new Date().toISOString()
    })

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmed) {
        console.log('⚪ [StrategyContext] navigateToCreate CANCELLED by user')
        return false
      }
    }

    // Clear strategy (includes auto-save) and navigate
    await clearStrategy()
    router.push('/create')
    console.log('✅ [StrategyContext] navigateToCreate COMPLETE')
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
