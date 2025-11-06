"use client"

import { useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiere/shared/components/ui/tabs'
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  MessageSquare, 
  Layers,
  Settings,
  Code,
  LineChart
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
  const [activeTab, setActiveTab] = useState('parameters')

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] z-40">
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
    <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-80 bg-background border-r border-primary/20 z-40 flex flex-col">
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

      {/* Scrollable Chats & Strategies Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Chats Section */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Chats
            </h3>
          </div>
          <div className="space-y-2">
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
        </div>

        {/* Strategies Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Strategies
            </h3>
          </div>
          <div className="space-y-2">
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
        </div>
      </div>

      {/* Bottom Tabs Panel */}
      <div className="border-t border-primary/20 bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1">
            <TabsTrigger 
              value="parameters" 
              className="text-xs hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-3 w-3 mr-1" />
              Parameters
            </TabsTrigger>
            <TabsTrigger 
              value="code"
              className="text-xs hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Code className="h-3 w-3 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger 
              value="backtest"
              className="text-xs hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LineChart className="h-3 w-3 mr-1" />
              Backtest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="p-4 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">Strategy parameters will appear here when you start creating a strategy.</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Timeframe:</span>
                  <span className="text-foreground">15m</span>
                </div>
                <div className="flex justify-between">
                  <span>Asset:</span>
                  <span className="text-foreground">SOL/USD</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="p-4 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground">
              <p>Generated TSDL code will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="backtest" className="p-4 max-h-48 overflow-y-auto">
            <div className="text-xs text-muted-foreground">
              <p>Backtest results will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
