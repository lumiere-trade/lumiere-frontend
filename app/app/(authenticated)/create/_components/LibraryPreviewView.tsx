"use client"

import { useState } from "react"
import { MessageInput } from "@/components/strategy/MessageInput"
import { BookOpen, TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react"
import type { Strategy } from "@/contexts/StrategyContext"
import type { EducationalContent } from "@/lib/api/architect"

interface LibraryPreviewViewProps {
  strategy: Strategy
  educationalContent?: EducationalContent
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onViewStrategy: () => void
  isHealthy: boolean
  isSending: boolean
}

export function LibraryPreviewView({
  strategy,
  educationalContent,
  inputValue,
  onInputChange,
  onSend,
  onViewStrategy,
  isHealthy,
  isSending,
}: LibraryPreviewViewProps) {
  const [activeTab, setActiveTab] = useState<'concept' | 'entry' | 'exit' | 'risk' | 'philosophy'>('concept')

  const tabs = [
    { id: 'concept' as const, label: 'Concept', icon: BookOpen, content: educationalContent?.concept },
    { id: 'entry' as const, label: 'Entry Logic', icon: TrendingUp, content: educationalContent?.entry_logic },
    { id: 'exit' as const, label: 'Exit Logic', icon: TrendingDown, content: educationalContent?.exit_logic },
    { id: 'risk' as const, label: 'Risk/Reward', icon: Target, content: educationalContent?.risk_reward },
    { id: 'philosophy' as const, label: 'Philosophy', icon: Lightbulb, content: educationalContent?.philosophy },
  ].filter(tab => tab.content)

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              {strategy.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {strategy.description}
            </p>
            <button
              onClick={onViewStrategy}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              View Strategy Details
            </button>
          </div>

          {educationalContent && tabs.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {tabs.find(t => t.id === activeTab)?.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
          <MessageInput
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            disabled={!isHealthy || isSending}
            placeholder="Ask Prophet to modify this strategy..."
          />
          <div className="flex justify-center pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Lumiere is AI and can make mistakes. Use for educational purposes and not as trading advice.
            </p>
          </div>
          {!isHealthy && (
            <p className="text-center text-sm text-destructive mt-2">
              Prophet AI is not responding. Please check the connection.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
