import { useState, useRef } from 'react'
import { useStrategy } from '@/contexts/StrategyContext'
import { useProphetHealthQuery } from './queries/use-prophet-queries'
import {
  sendChatMessageStream,
  ProgressEvent,
  StrategyGeneratedEvent,
} from '@/lib/api/prophet'

export function useProphet() {
  const {
    strategy,
    setStrategy,
    updateStrategy,
    addMessage,
    updateLastMessage,
    backtestResults,
    isGeneratingStrategy,
    setIsGeneratingStrategy,
    setStrategyGenerationProgress,
    setProgressStage,
    setProgressMessage,
    openDetailsPanel,
    setDetailsPanelTab
  } = useStrategy()

  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Health check query
  const { data: healthData, error: healthError, isLoading } = useProphetHealthQuery()

  // Optimistic: assume healthy unless explicit error
  const isHealthy = healthError ? false : (healthData?.status === 'healthy' || isLoading)

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Get current messages from strategy
    const messages = strategy?.messages || []

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    // Add both messages immediately
    if (strategy) {
      addMessage(userMessage)
      addMessage(assistantMessage)
    } else {
      // No strategy yet - create initial empty strategy with messages
      setStrategy({
        id: null,
        userId: null,
        name: '',
        description: '',
        tsdl: {
          name: '',
          description: '',
          symbol: 'SOL/USDC',
          timeframe: '1h',
          indicators: [],
          entry_rules: [],
          entry_logic: '',
          exit_rules: [],
          exit_logic: '',
          stop_loss: 3.0,
          take_profit: null,
          trailing_stop: null,
        },
        conversationId: null,
        messages: [userMessage, assistantMessage],
        createdAt: null,
        updatedAt: null
      })
    }

    setIsStreaming(true)

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    // Build strategy context - ALWAYS send if strategy exists with TSDL data
    // This allows Prophet to modify existing strategies (even unsaved ones)
    let strategyContext = undefined
    if (strategy?.tsdl && strategy.name) {
      // Build backtest summary if results exist
      let backtestSummary = undefined
      if (backtestResults?.metrics) {
        const m = backtestResults.metrics
        const ta = backtestResults.trade_analysis
        backtestSummary = {
          // Performance
          total_return_pct: m.total_return_pct,
          cagr: m.cagr,
          sharpe_ratio: m.sharpe_ratio,
          sortino_ratio: m.sortino_ratio,
          max_drawdown_pct: m.max_drawdown_pct,
          // Trades
          total_trades: m.total_trades,
          winning_trades: m.winning_trades,
          losing_trades: m.losing_trades,
          win_rate: m.win_rate,
          profit_factor: m.profit_factor,
          // Trade analysis
          avg_win: ta?.avg_win,
          avg_loss: ta?.avg_loss,
          largest_win: ta?.largest_win,
          largest_loss: ta?.largest_loss,
          avg_holding_time_minutes: ta?.avg_holding_time_minutes,
          longest_winning_streak: ta?.longest_winning_streak,
          longest_losing_streak: ta?.longest_losing_streak,
          // Meta
          backtest_period: {
            start: backtestResults.start_date,
            end: backtestResults.end_date,
          },
          initial_capital: backtestResults.initial_capital,
          final_equity: m.final_equity,
        }
      }

      strategyContext = {
        strategy_id: strategy.id || 'unsaved',
        current_tsdl: JSON.stringify(strategy.tsdl, null, 2),
        strategy_name: strategy.name,
        last_updated: strategy.updatedAt || null,
        backtest_summary: backtestSummary
      }
    }

    let fullResponse = ''
    let strategyWasGenerated = false

    await sendChatMessageStream(
      {
        message,
        conversation_id: strategy?.conversationId || undefined,
        user_id: 'user-1',
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        strategy_context: strategyContext
      },
      // onToken - stream response text
      (token: string) => {
        fullResponse += token
        updateLastMessage(fullResponse)
      },
      // onProgress - strategy generation progress
      (progress: ProgressEvent) => {
        setIsGeneratingStrategy(true)
        setStrategyGenerationProgress(progress.percent)
        setProgressStage(progress.stage)
        setProgressMessage(progress.message)
      },
      // onStrategyGenerated - build Strategy from Prophet response
      (strategyEvent: StrategyGeneratedEvent) => {
        // Hide progress
        setIsGeneratingStrategy(false)
        setStrategyGenerationProgress(0)

        // Flag that strategy was generated (will open panel in onComplete)
        strategyWasGenerated = true

        // Extract TSDL JSON from Prophet response
        const tsdlJson = strategyEvent.tsdl_json

        if (strategy) {
          // Update existing strategy
          updateStrategy({
            name: strategyEvent.strategy_name,
            description: tsdlJson.description,
            tsdl: tsdlJson
          })
        } else {
          // Create new strategy from Prophet response (messages already added above)
          updateStrategy({
            name: strategyEvent.strategy_name,
            description: tsdlJson.description,
            tsdl: tsdlJson
          })
        }

        // Set default tab to parameters
        setDetailsPanelTab('parameters')
      },
      // onComplete - message streaming complete
      (fullMessage: string, convId: string) => {
        setIsStreaming(false)
        abortControllerRef.current = null

        // CRITICAL: Save conversation_id from backend for next message
        updateStrategy({
          conversationId: convId
        })

        // Add strategy marker if strategy was generated
        const finalMessage = strategyWasGenerated
          ? `${fullMessage}\n\n<<view_strategy>>`
          : fullMessage

        // Update last message with final content
        updateLastMessage(finalMessage)

        // Open details panel AFTER streaming completes if strategy was generated
        if (strategyWasGenerated) {
          openDetailsPanel()
        }
      },
      // onError - handle streaming errors
      (error: Error) => {
        setIsStreaming(false)
        setIsGeneratingStrategy(false)
        abortControllerRef.current = null

        // Update last message with error
        updateLastMessage(`Error: ${error.message}`)
      },
      // signal - AbortSignal for cancellation
      abortControllerRef.current.signal
    )
  }

  // Deprecated - conversation history loads via StrategyContext
  const loadHistory = async () => {
    console.warn('loadHistory is deprecated - history loads via StrategyContext')
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setIsGeneratingStrategy(false)
      setStrategyGenerationProgress(0)
    }
  }

  return {
    messages: strategy?.messages || [],
    isStreaming,
    isSending: isStreaming,
    isGeneratingStrategy,
    isHealthy,
    error: healthError,
    sendMessage,
    loadHistory,
    stopGeneration
  }
}
