"use client"

import { useEffect } from 'react'
import { getStrategy, getLibraryStrategy } from '@/lib/api/architect'
import { tsdlApi } from '@/lib/api/tsdl'
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

      // IMPORTANT: Use TSDL API to parse and validate
      // Frontend should NOT parse TSDL structure directly
      const parsedJson = tsdlApi.parseTSDLCode(strategyData.tsdl_code)
      const validatedTsdl = await tsdlApi.extractAll(parsedJson)

      // Extract description from validated TSDL (with fallback)
      const description = validatedTsdl.description || `${strategyData.name} - Strategy`

      const newStrategy: Strategy = {
        id: strategyData.id,
        userId: strategyData.user_id,
        name: strategyData.name,
        description: description,
        tsdl: validatedTsdl,
        messages: [], // Start with empty messages - conversation is ephemeral
        createdAt: strategyData.created_at,
        updatedAt: strategyData.updated_at
      }

      setStrategy(newStrategy)
      setEducationalContent(null)
      toast.success(`Strategy "${strategyData.name}" loaded`)
      setDetailsPanelTab('parameters')
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      console.error('Failed to load strategy:', error)
      toast.error('Failed to load strategy')
    }
  }

  const loadLibraryStrategy = async (id: string) => {
    try {
      toast.dismiss()

      const lib = await getLibraryStrategy(id)

      // IMPORTANT: Library now returns tsdl_code (Single Source of Truth)
      // Parse TSDL code to get strategy data
      const parsedJson = tsdlApi.parseTSDLCode(lib.tsdl_code)
      const validatedTsdl = await tsdlApi.extractAll(parsedJson)

      // Extract description from validated TSDL (with fallback)
      const description = validatedTsdl.description || `${lib.name} - Library strategy`

      const newStrategy: Strategy = {
        id: null,
        userId: null,
        name: lib.name,
        description: description,
        tsdl: validatedTsdl,
        messages: [], // Start with empty messages
        createdAt: null,
        updatedAt: null
      }

      setStrategy(newStrategy)
      setEducationalContent(lib.educational_content || null)
      toast.success(`Library strategy "${lib.name}" loaded as template`)
      setDetailsPanelTab('library')
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      console.error('Failed to load library strategy:', error)
      toast.error('Failed to load library strategy')
      setEducationalContent(null)
    }
  }

  return {}
}
