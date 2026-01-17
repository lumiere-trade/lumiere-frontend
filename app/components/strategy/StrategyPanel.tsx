"use client"

/**
 * StrategyPanel - Sidebar for strategy management
 * Used inside LeftPanel flex layout (not fixed positioning)
 * Collapsed: 64px, Expanded: 240px
 */

import { useStrategy } from "@/contexts/StrategyContext"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { useUpdateStrategy } from "@/hooks/mutations/use-architect-mutations"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StrategyPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function StrategyPanel({ isOpen, onToggle }: StrategyPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { navigateToCreate } = useStrategy()
  const [strategiesExpanded, setStrategiesExpanded] = useState(true)
  const [libraryExpanded, setLibraryExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all strategies (draft, active, paused) - no status filter
  const { strategies, isLoading, deleteStrategy, isDeleting } = useStrategies({
    limit: 50
  })

  // Update strategy mutation for rename
  const updateStrategyMutation = useUpdateStrategy()

  // Fetch library data
  const { data: categories = [], isLoading: categoriesLoading } = useLibraryCategories()
  const { data: librarySearchResults = [], isLoading: searchLoading } = useLibrarySearch(
    searchQuery,
    20
  )

  const handleNewStrategy = async () => {
    await navigateToCreate(router)
  }

  const handleStrategyClick = async (strategyId: string) => {
    // Don't reload if URL already shows this strategy
    const currentStrategyId = searchParams.get('strategy')
    if (currentStrategyId === strategyId) {
      return
    }

    // No conversation auto-save - conversations are ephemeral

    // Navigate directly - let create/page useEffect handle loading
    router.push(`/create?strategy=${strategyId}`)
  }

  const handleLibraryStrategyClick = async (strategyId: string) => {
    // No conversation auto-save - conversations are ephemeral

    // Navigate directly - let create/page useEffect handle loading
    router.push(`/create?library=${strategyId}`)
  }

  const startEditing = (strategyId: string, currentName: string) => {
    setEditingId(strategyId)
    setEditingName(currentName)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName("")
  }

  const saveRename = async (strategyId: string) => {
    const newName = editingName.trim()

    if (!newName || newName === strategies.find(s => s.id === strategyId)?.name) {
      cancelEditing()
      return
    }

    try {
      await updateStrategyMutation.mutateAsync({
        strategyId,
        updates: { name: newName }
      })
      toast.success('Strategy renamed')
      cancelEditing()
    } catch (error) {
      console.error('Rename failed:', error)
      toast.error('Failed to rename strategy')
    }
  }

  const handleDelete = async (strategyId: string, strategyName: string) => {
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

  // Filter user strategies by search query
  const filteredStrategies = searchQuery
    ? strategies.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Determine if we're in search mode
  const isSearching = searchQuery.trim().length > 0

  // Combined search results
  const userSearchResults = filteredStrategies
  const totalSearchResults = userSearchResults.length + librarySearchResults.length

  return (
    <aside className={cn(
      "h-full flex flex-col bg-card transition-all duration-300 border-r border-border shrink-0",
      isOpen ? "w-[240px]" : "w-16"
    )}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-2 h-[53px] shrink-0 border-b border-border">
        {isOpen ? (
          <>
            <button
              onClick={handleNewStrategy}
              className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background transition-colors"
            >
              <Plus className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">New</span>
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 rounded hover:bg-background transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-background transition-colors mx-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {!isOpen ? (
          // Collapsed - icon only
          <nav className="p-2 space-y-1">
            <button
              onClick={handleNewStrategy}
              className="w-full p-2 rounded hover:bg-background transition-colors"
              title="New Strategy"
            >
              <Plus className="h-5 w-5 mx-auto" />
            </button>
            <button
              className="w-full p-2 rounded hover:bg-background transition-colors"
              title="Strategies"
            >
              <Layers className="h-5 w-5 mx-auto" />
            </button>
            <button
              className="w-full p-2 rounded hover:bg-background transition-colors"
              title="Library"
            >
              <BookOpen className="h-5 w-5 mx-auto" />
            </button>
          </nav>
        ) : (
          // Expanded - full content
          <div className="space-y-2 p-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary/40"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {isSearching ? (
              // Search Results View
              <div className="space-y-2">
                {totalSearchResults === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No results
                  </div>
                ) : (
                  <>
                    {/* User Strategies Results */}
                    {userSearchResults.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground px-1">
                          YOUR STRATEGIES
                        </p>
                        {userSearchResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleStrategyClick(s.id)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-background truncate"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Library Results */}
                    {librarySearchResults.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground px-1">
                          LIBRARY
                        </p>
                        {librarySearchResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleLibraryStrategyClick(s.id)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-background truncate"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Normal View - No Search
              <>
                {/* Strategies section */}
                <div>
                  <button
                    onClick={() => setStrategiesExpanded(!strategiesExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">Strategies</span>
                    </div>
                    {strategiesExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {strategiesExpanded && (
                    <div className="mt-1 space-y-0.5">
                      {isLoading ? (
                        <>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="px-2 py-1.5 animate-pulse">
                              <div className="h-3 bg-muted rounded w-2/3" />
                            </div>
                          ))}
                        </>
                      ) : strategies.length === 0 ? (
                        <div className="text-center py-4 px-2">
                          <button
                            onClick={handleNewStrategy}
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create first strategy
                          </button>
                        </div>
                      ) : (
                        strategies.map((strategyItem) => {
                          const isThisDeleting = deletingId === strategyItem.id
                          const isHovered = hoveredId === strategyItem.id
                          const isEditing = editingId === strategyItem.id

                          return (
                            <div
                              key={strategyItem.id}
                              onMouseEnter={() => setHoveredId(strategyItem.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              className="relative group"
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(strategyItem.id)
                                    if (e.key === 'Escape') cancelEditing()
                                  }}
                                  onBlur={() => saveRename(strategyItem.id)}
                                  autoFocus
                                  className="w-full px-2 py-1.5 text-sm bg-background border border-primary/40 rounded focus:outline-none focus:border-primary"
                                />
                              ) : (
                                <button
                                  onClick={() => handleStrategyClick(strategyItem.id)}
                                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-background transition-colors truncate pr-14"
                                >
                                  {strategyItem.name}
                                </button>
                              )}

                              {isHovered && !isEditing && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startEditing(strategyItem.id, strategyItem.name)
                                    }}
                                    disabled={isDeleting}
                                    className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
                                    title="Rename"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(strategyItem.id, strategyItem.name)
                                    }}
                                    disabled={isDeleting || isThisDeleting}
                                    className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
                                    title="Delete"
                                  >
                                    <Trash2 className={cn(
                                      "h-3.5 w-3.5 text-muted-foreground",
                                      isThisDeleting && "animate-pulse"
                                    )} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Library section */}
                <div>
                  <button
                    onClick={() => setLibraryExpanded(!libraryExpanded)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">Library</span>
                    </div>
                    {libraryExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {libraryExpanded && (
                    <div className="mt-1 space-y-1">
                      {categoriesLoading ? (
                        <>
                          {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-6 bg-muted rounded mb-1" />
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
              </>
            )}
          </div>
        )}
      </div>
    </aside>
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
        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-background transition-colors"
      >
        <span className="text-sm font-medium truncate">
          {category.display_name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {strategies.length}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {isLoading ? (
            <div className="py-1.5 px-2">
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          ) : strategies.length === 0 ? (
            <div className="py-1.5 px-2 text-xs text-muted-foreground">
              No strategies
            </div>
          ) : (
            strategies.map((libraryStrategy) => (
              <button
                key={libraryStrategy.id}
                onClick={() => onStrategyClick(libraryStrategy.id)}
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-background transition-colors truncate"
              >
                {libraryStrategy.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
