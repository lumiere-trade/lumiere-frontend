"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface CreateChatContextType {
  isChatExpanded: boolean
  generatedStrategy: any | null
  inputValue: string
  expandChat: () => void
  collapseChat: () => void
  setGeneratedStrategy: (strategy: any) => void
  setInputValue: (value: string) => void
}

const CreateChatContext = createContext<CreateChatContextType | undefined>(undefined)

export function CreateChatProvider({ children }: { children: ReactNode }) {
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [inputValue, setInputValue] = useState("")

  const expandChat = () => setIsChatExpanded(true)
  const collapseChat = () => setIsChatExpanded(false)

  return (
    <CreateChatContext.Provider
      value={{
        isChatExpanded,
        generatedStrategy,
        inputValue,
        expandChat,
        collapseChat,
        setGeneratedStrategy,
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
