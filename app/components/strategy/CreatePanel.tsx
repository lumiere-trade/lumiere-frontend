"use client"

import { useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  MessageSquare, 
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface CreatePanelProps {
  isOpen: boolean
  onToggle: () => void
}

const mockChats = [
  { id: 1, title: "SOL Momentum Strategy", date: "2 hours ago" },
  { id: 2, title: "RSI Mean Reversion", date: "Yesterday" },
  { id: 3, title: "Breakout Trading", date: "2 days ago" },
]

const mockStrategies = [
  { id: 1, name: "SOL Momentum", status: "Active", winRate: "67.3%" },
  { id: 2, name: "RSI Reversion", status: "Backtesting", winRate: "72.1%" },
]

export function CreatePanel({ isOpen, onToggle }: CreatePanelProps) {
  const [expandedSection, setExpandedSection] = useState<'chats' | 'strategies' | null>(null)

  const toggleSection = (section: 'chats' | 'strategies') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-0 h-screen z-40">
        <button
          onClick={onToggle}
          className="h-full px-2 bg-card border-r border-primary/20 hover:bg-card/80 transition-colors"
          title="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-primary" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-[360px] bg-background border-r border-primary/20 z-40 flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        <h2 className="text-sm font-bold text-primary">CREATE</h2>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
          title="Close sidebar"
        >
          <PanelLeftClose className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-b border-primary/20">
        <Button 
          className="w-full rounded-full gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Chats Section */}
        <div className="border-b border-primary/20">
          <button
            onClick={() => toggleSection('chats')}
            className="w-full flex items-center justify-between p-4 hover:bg-card/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Chats
              </h3>
            </div>
            {expandedSection === 'chats' ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary" />
            )}
          </button>

          {expandedSection === 'chats' && (
            <div className="p-4 pt-0 space-y-2">
              {mockChats.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full text-left p-3 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {chat.date}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Strategies Section */}
        <div className="border-b border-primary/20">
          <button
            onClick={() => toggleSection('strategies')}
            className="w-full flex items-center justify-between p-4 hover:bg-card/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Strategies
              </h3>
            </div>
            {expandedSection === 'strategies' ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary" />
            )}
          </button>

          {expandedSection === 'strategies' && (
            <div className="p-4 pt-0 space-y-2">
              {mockStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  className="w-full text-left p-3 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground truncate">
                    {strategy.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {strategy.status}
                    </span>
                    <span className="text-xs text-green-500">
                      {strategy.winRate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
