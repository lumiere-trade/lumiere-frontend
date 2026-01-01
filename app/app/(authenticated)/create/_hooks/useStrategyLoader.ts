"use client"

import { useEffect } from 'react'
import { getStrategy, getStrategyConversations, getConversation, getLibraryStrategy } from '@/lib/api/architect'
import { toast } from 'sonner'
import type { Strategy, DetailsPanelTab } from '@/contexts/StrategyContext'
import type { EducationalContent } from '@/lib/api/architect'

interface UseStrategyLoaderProps {
  strategyId: string | null
  libraryId: string | null
  currentStrategy: Strategy | null
  setStrategy: (strategy: Strategy | null) => void
  setEducationalContent: (content: EducationalContent | null) => void
  clearStrategy: () => Promise<void>
  openDetailsPanel: () => void
  setDetailsPanelTab: (tab: DetailsPanelTab) => void
}

export function useStrategyLoader({
  strategyId,
  libraryId,
  currentStrategy,
  setStrategy,
  setEducationalContent,
  clearStrategy,
  openDetailsPanel,
  setDetailsPanelTab,
}: UseStrategyLoaderProps) {

  useEffect(() => {
    const loadData = async () => {
      if (strategyId) {
        const isDifferentStrategy = !currentStrategy || currentStrategy.id !== strategyId

        if (isDifferentStrategy) {
          await clearStrategy()
          setEducationalContent(null)
          await loadUserStrategy(strategyId)
        }
      }
      else if (libraryId) {
        await clearStrategy()
        await loadLibraryStrategy(libraryId)
      }
      else if (!strategyId && !libraryId && currentStrategy) {
        await clearStrategy()
        setStrategy(null)
        setEducationalContent(null)
      } else {
        if (!strategyId && !libraryId && !currentStrategy) {
          setStrategy(null)
          setEducationalContent(null)
        }
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

      setStrategy(newStrategy)
      setEducationalContent(null) // User strategies don't have educational content
      toast.success(`Strategy "${strategyData.name}" loaded`)
      setDetailsPanelTab('parameters')
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
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

      setStrategy(newStrategy)
      setEducationalContent(lib.educational_content || null)
      toast.success(`Library strategy "${lib.name}" loaded as template`)
      setDetailsPanelTab('library') // Open Library tab for library strategies
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      toast.error('Failed to load library strategy')
      setEducationalContent(null)
    }
  }

  return {}
}
