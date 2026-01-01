"use client"

import { useState } from "react"
import { BookOpen, TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react"
import { useStrategy } from "@/contexts/StrategyContext"

export function LibraryEducationalContent() {
  const { strategy, educationalContent } = useStrategy()
  const [activeTab, setActiveTab] = useState<'concept' | 'entry' | 'exit' | 'risk' | 'philosophy'>('concept')

  if (!educationalContent) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No educational content available</p>
      </div>
    )
  }

  const tabs = [
    { id: 'concept' as const, label: 'Concept', icon: BookOpen, content: educationalContent.concept },
    { id: 'entry' as const, label: 'Entry Logic', icon: TrendingUp, content: educationalContent.entry_logic },
    { id: 'exit' as const, label: 'Exit Logic', icon: TrendingDown, content: educationalContent.exit_logic },
    { id: 'risk' as const, label: 'Risk/Reward', icon: Target, content: educationalContent.risk_reward },
    { id: 'philosophy' as const, label: 'Philosophy', icon: Lightbulb, content: educationalContent.philosophy },
  ].filter(tab => tab.content)

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No educational content available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Strategy Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{strategy?.name}</h2>
        <p className="text-base text-muted-foreground">{strategy?.description}</p>
      </div>

      {/* Educational Tabs */}
      <div className="space-y-4">
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
    </div>
  )
}
