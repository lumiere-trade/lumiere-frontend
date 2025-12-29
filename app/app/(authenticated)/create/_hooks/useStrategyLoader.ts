"use client"

import { useEffect } from 'react'
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'
import { getStrategy, getStrategyConversations, getConversation, getLibraryStrategy } from '@/lib/api/architect'
import { toast } from 'sonner'
import type { Strategy } from '@/contexts/StrategyContext'

interface UseStrategyLoaderProps {
  strategyId: string | null
  libraryId: string | null
  currentStrategy: Strategy | null
  setStrategy: (strategy: Strategy | null) => void
  clearStrategy: () => Promise<void>
  openDetailsPanel: () => void
}

export function useStrategyLoader({
  strategyId,
  libraryId,
  currentStrategy,
  setStrategy,
  clearStrategy,
  openDetailsPanel,
}: UseStrategyLoaderProps) {
  const logger = useLogger('useStrategyLoader', LogCategory.COMPONENT)

  useEffect(() => {
    console.log('🟦 [useStrategyLoader] useEffect triggered', {
      strategyId,
      libraryId,
      currentStrategyId: currentStrategy?.id,
      currentStrategyName: currentStrategy?.name,
      timestamp: new Date().toISOString()
    })

    const loadData = async () => {
      // Load user strategy from URL
      if (strategyId) {
        const isDifferentStrategy = !currentStrategy || currentStrategy.id !== strategyId

        console.log('🟦 [useStrategyLoader] User strategy path', {
          strategyId,
          isDifferentStrategy,
          currentStrategyId: currentStrategy?.id,
          timestamp: new Date().toISOString()
        })

        if (isDifferentStrategy) {
          console.log('🔴 [useStrategyLoader] Different strategy detected - clearing', {
            from: currentStrategy?.id || 'null',
            to: strategyId,
            timestamp: new Date().toISOString()
          })
          
          // CRITICAL: Clear context first (auto-saves conversations)
          await clearStrategy()
          
          console.log('✅ [useStrategyLoader] clearStrategy complete - loading new strategy', {
            strategyId,
            timestamp: new Date().toISOString()
          })
          
          // Then load new strategy
          await loadUserStrategy(strategyId)
          
          console.log('✅ [useStrategyLoader] loadUserStrategy complete', {
            strategyId,
            timestamp: new Date().toISOString()
          })
        } else {
          console.log('⚪ [useStrategyLoader] Same strategy - skipping reload', {
            strategyId,
            timestamp: new Date().toISOString()
          })
        }
      }
      // Load library strategy template
      else if (libraryId) {
        console.log('🟦 [useStrategyLoader] Library strategy path', {
          libraryId,
          timestamp: new Date().toISOString()
        })
        
        console.log('🔴 [useStrategyLoader] Loading library - clearing first', {
          libraryId,
          timestamp: new Date().toISOString()
        })
        
        // CRITICAL: Clear context first (auto-saves conversations)
        await clearStrategy()
        
        console.log('✅ [useStrategyLoader] clearStrategy complete - loading library', {
          libraryId,
          timestamp: new Date().toISOString()
        })
        
        // Then load library template
        await loadLibraryStrategy(libraryId)
        
        console.log('✅ [useStrategyLoader] loadLibraryStrategy complete', {
          libraryId,
          timestamp: new Date().toISOString()
        })
      }
      // No URL params - clear if strategy exists
      else if (!strategyId && !libraryId && currentStrategy) {
        console.log('🟦 [useStrategyLoader] No URL params - clearing', {
          currentStrategyId: currentStrategy.id,
          timestamp: new Date().toISOString()
        })
        
        await clearStrategy()
        
        console.log('✅ [useStrategyLoader] clearStrategy complete', {
          timestamp: new Date().toISOString()
        })
      } else {
        console.log('⚪ [useStrategyLoader] No action needed', {
          strategyId,
          libraryId,
          hasCurrentStrategy: !!currentStrategy,
          timestamp: new Date().toISOString()
        })
      }
    }

    loadData()
  }, [strategyId, libraryId])

  const loadUserStrategy = async (id: string) => {
    try {
      console.log('🟢 [useStrategyLoader] loadUserStrategy START', {
        strategyId: id,
        timestamp: new Date().toISOString()
      })
      
      toast.dismiss()

      const strategyData = await getStrategy(id)
      console.log('✅ [useStrategyLoader] Strategy data fetched', {
        strategyId: id,
        name: strategyData.name,
        timestamp: new Date().toISOString()
      })

      const tsdlJson = JSON.parse(strategyData.tsdl_code)

      const { conversations } = await getStrategyConversations(id)
      console.log('✅ [useStrategyLoader] Conversations list fetched', {
        strategyId: id,
        conversationCount: conversations.length,
        timestamp: new Date().toISOString()
      })

      let conversationData = {
        id: null as string | null,
        messages: [] as any[],
      }

      if (conversations.length > 0) {
        const latestConversation = conversations.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        console.log('🟢 [useStrategyLoader] Loading latest conversation', {
          conversationId: latestConversation.id,
          timestamp: new Date().toISOString()
        })

        const fullConversation = await getConversation(latestConversation.id)
        conversationData = {
          id: fullConversation.id,
          messages: fullConversation.messages.map(msg => ({
            id: msg.id || Date.now().toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            isStreaming: false,
            hasStrategy: false
          })),
        }

        console.log('✅ [useStrategyLoader] Conversation loaded', {
          conversationId: fullConversation.id,
          messageCount: conversationData.messages.length,
          timestamp: new Date().toISOString()
        })
      }

      const newStrategy = {
        id: strategyData.id,
        name: strategyData.name,
        description: strategyData.description,
        tsdl: tsdlJson,
        status: strategyData.status,
        basePlugins: strategyData.base_plugins,
        version: strategyData.version,
        conversation: conversationData,
        createdAt: strategyData.created_at,
        updatedAt: strategyData.updated_at
      }

      console.log('🟢 [useStrategyLoader] Calling setStrategy', {
        strategyId: newStrategy.id,
        name: newStrategy.name,
        messageCount: newStrategy.conversation.messages.length,
        timestamp: new Date().toISOString()
      })

      setStrategy(newStrategy)

      toast.success(`Strategy "${strategyData.name}" loaded`)
      setTimeout(() => openDetailsPanel(), 100)
      
      console.log('✅ [useStrategyLoader] loadUserStrategy COMPLETE', {
        strategyId: id,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [useStrategyLoader] loadUserStrategy FAILED', {
        strategyId: id,
        error,
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to load strategy')
    }
  }

  const loadLibraryStrategy = async (id: string) => {
    try {
      console.log('🟢 [useStrategyLoader] loadLibraryStrategy START', {
        libraryId: id,
        timestamp: new Date().toISOString()
      })
      
      toast.dismiss()

      const lib = await getLibraryStrategy(id)
      console.log('✅ [useStrategyLoader] Library data fetched', {
        libraryId: id,
        name: lib.name,
        timestamp: new Date().toISOString()
      })

      const strategyJson = {
        name: lib.name,
        description: lib.description,
        symbol: lib.symbol,
        timeframe: lib.timeframe,
        indicators: lib.indicators,
        entry_rules: lib.entry_rules,
        entry_logic: lib.entry_logic,
        exit_rules: lib.exit_rules,
        exit_logic: lib.exit_logic,
        stop_loss: lib.parameters.stop_loss,
        take_profit: lib.parameters.take_profit,
        trailing_stop: lib.parameters.trailing_stop,
      }

      const strategyType = 'indicator_based'

      const newStrategy = {
        id: null,
        name: lib.name,
        description: lib.description,
        tsdl: strategyJson as any,
        status: 'draft' as const,
        basePlugins: [strategyType],
        version: '1.0.0',
        conversation: {
          id: null,
          messages: [],
        },
        createdAt: null,
        updatedAt: null
      }

      console.log('🟢 [useStrategyLoader] Calling setStrategy (library)', {
        name: newStrategy.name,
        timestamp: new Date().toISOString()
      })

      setStrategy(newStrategy)

      toast.success(`Library strategy "${lib.name}" loaded as template`)
      setTimeout(() => openDetailsPanel(), 100)
      
      console.log('✅ [useStrategyLoader] loadLibraryStrategy COMPLETE', {
        libraryId: id,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [useStrategyLoader] loadLibraryStrategy FAILED', {
        libraryId: id,
        error,
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to load library strategy')
    }
  }
}
