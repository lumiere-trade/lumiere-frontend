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
    const loadData = async () => {
      if (strategyId) {
        const shouldLoad = !currentStrategy || currentStrategy.id !== strategyId

        if (shouldLoad) {
          logger.info('Loading user strategy', { strategyId })
          await loadUserStrategy(strategyId)
        }
      } else if (libraryId) {
        logger.info('Loading library strategy', { libraryId })
        await loadLibraryStrategy(libraryId)
      } else if (!strategyId && !libraryId && currentStrategy) {
        logger.info('Clearing strategy state')
        await clearStrategy()
      }
    }

    loadData()
  }, [strategyId, libraryId])

  const loadUserStrategy = async (id: string) => {
    try {
      toast.dismiss()

      const strategyData = await getStrategy(id)
      const tsdlJson = JSON.parse(strategyData.tsdl_code)

      const { conversations } = await getStrategyConversations(id)
      let conversationData = {
        id: null as string | null,
        messages: [] as any[],
      }

      if (conversations.length > 0) {
        const latestConversation = conversations.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

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

        logger.info('Conversation history loaded', {
          messageCount: conversationData.messages.length
        })
      }

      setStrategy({
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
      })

      toast.success(`Strategy "${strategyData.name}" loaded`)
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      logger.error('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
    }
  }

  const loadLibraryStrategy = async (id: string) => {
    try {
      toast.dismiss()

      const lib = await getLibraryStrategy(id)

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

      setStrategy({
        id: null,
        name: lib.name,
        description: lib.description,
        tsdl: strategyJson as any,
        status: 'draft',
        basePlugins: [strategyType],
        version: '1.0.0',
        conversation: {
          id: null,
          messages: [],
        },
        createdAt: null,
        updatedAt: null
      })

      toast.success(`Library strategy "${lib.name}" loaded as template`)
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      logger.error('Failed to load library strategy', { error })
      toast.error('Failed to load library strategy')
    }
  }
}
