"use client"

import { useStrategy } from "@/contexts/StrategyContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  ChevronDown,
  Pencil,
  Trash2,
  BookOpen,
  Search,
  X,
} from "lucide-react"
import { useStrategies } from "@/hooks/use-strategies"
import {
  useLibraryCategories,
  useLibraryStrategies,
  useLibrarySearch,
} from "@/hooks/queries/use-architect-queries"

interface StrategyPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function StrategyPanel({ isOpen, onToggle }: StrategyPanelProps) {
  const router = useRouter()
  const { navigateToCreate } = useStrategy()
  const [strategiesExpanded, setStrategiesExpanded] = useState(true)
  const [libraryExpanded, setLibraryExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all strategies (draft, active, paused) - no status filter
  const { strategies, isLoading, deleteStrategy, isDeleting } = useStrategies({
    limit: 50
  })

  // Fetch library data
  const { data: categories = [], isLoading: categoriesLoading } = useLibraryCategories()
  const { data: searchResults = [], isLoading: searchLoading } = useLibrarySearch(
    searchQuery,
    20
  )

  const handleNewStrategy = () => {
    navigateToCreate(router)
  }

  const handleStrategyClick = (strategyId: string) => {
    // Navigate to create page with strategy ID to load it
    router.push(`/create?strategy=${strategyId}`)
  }

  const handleLibraryStrategyClick = (strategyId: string) => {
    // TODO: Load library strategy template into Prophet
    console.log('Load library strategy:', strategyId)
    router.push(`/create?library=${strategyId}`)
  }

  const handleDelete = async (strategyId: string, strategyName: string) => {
    // Prevent double-click
    if (deletingId || isDeleting) return

    if (confirm(`Delete "${strategyName}"? This cannot be undone.`)) {
      setDeletingId(strategyId)
      try {
        await deleteStrategy(strategyId)
      } catch (error) {
        console.error('Delete failed:', error)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const toggleCategory = (categoryValue: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryValue)) {
      newExpanded.delete(categoryValue)
    } else {
      newExpanded.add(categoryValue)
    }
    setExpandedCategories(newExpanded)
  }

  const clearSearch = () => {
    setSearchQuery("")
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
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - full panel */}
      <div
        className={`fixed left-0 top-0 h-screen w-[300px] bg-background border-r border-primary/20 z-10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button - centered on right edge border - only visible when panel is open */}
        {isOpen && (
          <div
            className="absolute h-full flex items-center justify-center pointer-events-none z-20 translate-x-1/2 top-[54px]"
            style={{ right: '0' }}
          >
            <button
              onClick={onToggle}
              className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 transition-colors rounded-lg pointer-events-auto shadow-md"
              title="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-primary mx-auto" />
            </button>
          </div>
        )}

        {/* Spacer for header */}
        <div className="h-[54px] shrink-0" />

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* New Strategy Section */}
          <div className="border-b border-primary/20">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={handleNewStrategy}
                className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
              >
                <Plus className="h-5 w-5 text-primary shrink-0" />
                <span className="text-base text-primary whitespace-nowrap">
                  New Strategy
                </span>
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
                    <button
                      onClick={handleNewStrategy}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
                    >
                      <Plus className="h-4 w-4" />
                      Create your first strategy
                    </button>
                  </div>
                ) : (
                  // Strategy list
                  strategies.map((strategy) => {
                    const isThisDeleting = deletingId === strategy.id
                    const isHovered = hoveredId === strategy.id

                    return (
                      <div
                        key={strategy.id}
                        onClick={() => handleStrategyClick(strategy.id)}
                        onMouseEnter={() => setHoveredId(strategy.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="w-full text-left p-3 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <div className="text-base font-medium text-foreground truncate">
                          {strategy.name}
                        </div>
                        <div className="flex items-center justify-between mt-1 min-h-[24px]">
                          <span className="text-sm text-muted-foreground capitalize">
                            {strategy.status}
                          </span>

                          {/* Action buttons - always rendered, visibility controlled by opacity */}
                          <div className={`flex items-center gap-2 transition-opacity duration-200 ${
                            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStrategyClick(strategy.id)
                              }}
                              disabled={isDeleting}
                              className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit strategy"
                            >
                              <Pencil className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(strategy.id, strategy.name)
                              }}
                              disabled={isDeleting || isThisDeleting}
                              className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isThisDeleting ? "Deleting..." : "Delete strategy"}
                            >
                              <Trash2 className={`h-4 w-4 text-primary ${isThisDeleting ? 'animate-pulse' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Library Section */}
          <div className="border-b border-primary/20">
            <button
              onClick={() => setLibraryExpanded(!libraryExpanded)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-card/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <h3 className="text-base text-primary whitespace-nowrap">
                  Library
                </h3>
              </div>
              {libraryExpanded ? (
                <ChevronDown className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>

            {libraryExpanded && (
              <div className="px-4 pb-4">
                {/* Search Input */}
                <div className="mb-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search strategies..."
                    className="w-full pl-9 pr-9 py-2 text-base bg-card border border-primary/20 rounded-lg focus:outline-none focus:border-primary/40 transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Search Results or Categories */}
                {searchQuery ? (
                  // Search Results
                  <div className="space-y-2">
                    {searchLoading ? (
                      <div className="text-center py-4">
                        <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-4 text-base text-muted-foreground">
                        No strategies found
                      </div>
                    ) : (
                      searchResults.map((strategy) => (
                        <button
                          key={strategy.id}
                          onClick={() => handleLibraryStrategyClick(strategy.id)}
                          className="w-full text-left p-2.5 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors"
                        >
                          <div className="text-base font-medium text-foreground truncate">
                            {strategy.name}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize mt-0.5">
                            {strategy.category.replace('_', ' ')}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  // Categories with nested strategies
                  <div className="space-y-2">
                    {categoriesLoading ? (
                      <>
                        {[1, 2].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-8 bg-muted rounded mb-2" />
                          </div>
                        ))}
                      </>
                    ) : (
                      categories.map((category) => (
                        <CategorySection
                          key={category.value}
                          category={category}
                          isExpanded={expandedCategories.has(category.value)}
                          onToggle={() => toggleCategory(category.value)}
                          onStrategyClick={handleLibraryStrategyClick}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Category Section Component
interface CategorySectionProps {
  category: { value: string; display_name: string }
  isExpanded: boolean
  onToggle: () => void
  onStrategyClick: (strategyId: string) => void
}

function CategorySection({
  category,
  isExpanded,
  onToggle,
  onStrategyClick,
}: CategorySectionProps) {
  const { data: strategies = [], isLoading } = useLibraryStrategies({
    category: category.value,
    limit: 50,
  })

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors"
      >
        <span className="text-base font-medium text-foreground">
          {category.display_name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {strategies.length}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="ml-2 mt-1 space-y-1">
          {isLoading ? (
            <div className="py-2 px-2">
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          ) : strategies.length === 0 ? (
            <div className="py-2 px-2 text-sm text-muted-foreground">
              No strategies
            </div>
          ) : (
            strategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onStrategyClick(strategy.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-card transition-colors"
              >
                <div className="text-base text-foreground truncate">
                  {strategy.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
