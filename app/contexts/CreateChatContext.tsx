"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { StrategyMetadata } from '@/lib/api/prophet'

interface CreateChatContextType {
  isChatExpanded: boolean
  generatedStrategy: any | null
  strategyMetadata: StrategyMetadata | null
  inputValue: string
  expandChat: () => void
  collapseChat: () => void
  setGeneratedStrategy: (strategy: any) => void
  setStrategyMetadata: (metadata: StrategyMetadata | null) => void
  setInputValue: (value: string) => void
}

const CreateChatContext = createContext<CreateChatContextType | undefined>(undefined)

export function CreateChatProvider({ children }: { children: ReactNode }) {
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [strategyMetadata, setStrategyMetadata] = useState<StrategyMetadata | null>(null)
  const [inputValue, setInputValue] = useState("")

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)

  return (
    <CreateChatContext.Provider
      value={{
        isChatExpanded,
        generatedStrategy,
        strategyMetadata,
        inputValue,
        expandChat,
        collapseChat,
        setGeneratedStrategy,
        setStrategyMetadata,
        setInputValue,
      }}
    >
      {children}
    </CreateChatContext.Provider>
  )
}

export function useCreateChat() {
  const context = useContext(CreateChatContext)
  if (context === undefined) {
    throw new Error('useCreateChat must be used within CreateChatProvider')
  }
  return context
}
