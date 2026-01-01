"use client"

import { useState } from "react"
import { BookOpen, TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
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
        <h2 className="text-xl font-semibold text-foreground">{strategy?.name}</h2>
        <p className="text-base text-muted-foreground">{strategy?.description}</p>
      </div>

      {/* Educational Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className={`grid w-full items-center !p-0`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="text-md !h-auto gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                  {tab.content}
                </pre>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
