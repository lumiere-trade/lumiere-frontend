"use client"

import { useState } from "react"
import Link from "next/link"
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Layers,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2
} from "lucide-react"
import { useStrategies } from "@/hooks/use-strategies"

interface StrategyPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function StrategyPanel({ isOpen, onToggle }: StrategyPanelProps) {
  const [strategiesExpanded, setStrategiesExpanded] = useState(true)
  
  // Fetch real strategies from Architect
  const { strategies, isLoading, deleteStrategy } = useStrategies({
    status: 'active',
    limit: 50
  })

  const handleDelete = async (strategyId: string, strategyName: string) => {
    if (confirm(`Delete "${strategyName}"? This cannot be undone.`)) {
      try {
        await deleteStrategy(strategyId)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  return (
    <>
      {/* Collapsed state - thin strip */}
      <div
        className={`fixed left-0 top-0 h-screen w-8 z-10 bg-card border-r border-primary/20 transition-transform duration-300 ease-in-out ${
          isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="h-full flex items-center justify-center" style={{ marginTop: '54px' }}>
          <button
            onClick={onToggle}
            className="h-full w-full px-2 hover:bg-card/80 transition-colors"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - full panel */}
      <div
        className={`fixed left-0 top-0 h-screen w-[300px] bg-background border-r border-primary/20 z-10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Spacer for header */}
        <div className="h-[54px] shrink-0" />

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* New Strategy Section with Close Button */}
          <div className="border-b border-primary/20">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/create"
                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
              >
                <Plus className="h-5 w-5 text-primary shrink-0" />
                <span className="text-base text-primary whitespace-nowrap">
                  New Strategy
                </span>
              </Link>
              <button
                onClick={onToggle}
                className="p-1 rounded-lg hover:bg-primary/10 transition-colors ml-2 shrink-0"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Strategies Section */}
          <div className="border-b border-primary/20">
            <button
              onClick={() => setStrategiesExpanded(!strategiesExpanded)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-card/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary shrink-0" />
                <h3 className="text-base text-primary whitespace-nowrap">
                  Strategies
                </h3>
                {!isLoading && strategies.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({strategies.length})
                  </span>
                )}
              </div>
              {strategiesExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>

            {strategiesExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {isLoading ? (
                  // Loading skeleton
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-full p-3 rounded-lg border border-primary/20 bg-card animate-pulse"
                      >
                        <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    ))}
                  </>
                ) : strategies.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8 px-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      No strategies yet
                    </p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first strategy
                    </Link>
                  </div>
                ) : (
                  // Strategy list
                  strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className="w-full text-left p-3 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors"
                    >
                      <div className="text-base font-medium text-foreground truncate">
                        {strategy.name}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-muted-foreground capitalize">
                          {strategy.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Navigate to edit page
                              console.log('Edit strategy', strategy.id)
                            }}
                            className="p-1 rounded hover:bg-primary/10 transition-colors"
                            title="Edit strategy"
                          >
                            <Pencil className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(strategy.id, strategy.name)
                            }}
                            className="p-1 rounded hover:bg-primary/10 transition-colors"
                            title="Delete strategy"
                          >
                            <Trash2 className="h-4 w-4 text-primary" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
