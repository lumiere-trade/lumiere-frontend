"use client"

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
import { createConversation } from "@/lib/api/architect"

interface StrategyPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function StrategyPanel({ isOpen, onToggle }: StrategyPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { strategy, navigateToCreate, clearStrategy } = useStrategy()
  const [strategiesExpanded, setStrategiesExpanded] = useState(true)
  const [libraryExpanded, setLibraryExpanded] = useState(true)
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

    // Auto-save conversation before navigating (without clearing strategy)
    if (strategy?.id && strategy.conversation.messages.length > 0) {
      try {
        await createConversation({
          strategy_id: strategy.id,
          messages: strategy.conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }

    // Navigate directly - let create/page useEffect handle loading
    router.push(`/create?strategy=${strategyId}`)
  }

  const handleLibraryStrategyClick = async (strategyId: string) => {
    // Auto-save conversation before navigating (without clearing strategy)
    if (strategy?.id && strategy.conversation.messages.length > 0) {
      try {
        await createConversation({
          strategy_id: strategy.id,
          messages: strategy.conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }

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
        {/* Close button */}
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

        {/* Global Search - Always visible at top */}
        <div className="px-4 py-4 border-b border-primary/20">
          <div className="relative">
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
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isSearching ? (
            // Search Results View
            <div className="px-4 py-4 space-y-4">
              {isLoading || searchLoading ? (
                <div className="text-center py-4">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse" />
                </div>
              ) : totalSearchResults === 0 ? (
                <div className="text-center py-8 text-base text-muted-foreground">
                  No strategies found
                </div>
              ) : (
                <>
                  {/* User Strategies Results */}
                  {userSearchResults.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Your Strategies ({userSearchResults.length})
                      </h4>
                      {userSearchResults.map((strategyItem) => {
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
                                className="w-full px-2 py-2 text-base bg-card border border-primary/40 rounded-lg focus:outline-none focus:border-primary text-foreground"
                              />
                            ) : (
                              <button
                                onClick={() => handleStrategyClick(strategyItem.id)}
                                className="w-full text-left px-2 py-2 rounded-lg hover:bg-card transition-colors"
                              >
                                <div className="text-base text-foreground truncate pr-16">
                                  {strategyItem.name}
                                </div>
                              </button>
                            )}

                            {isHovered && !isEditing && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditing(strategyItem.id, strategyItem.name)
                                  }}
                                  disabled={isDeleting}
                                  className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Rename strategy"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(strategyItem.id, strategyItem.name)
                                  }}
                                  disabled={isDeleting || isThisDeleting}
                                  className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={isThisDeleting ? "Deleting..." : "Delete strategy"}
                                >
                                  <Trash2 className={`h-3 w-3 text-muted-foreground ${isThisDeleting ? 'animate-pulse' : ''}`} />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Library Results */}
                  {librarySearchResults.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                        Library ({librarySearchResults.length})
                      </h4>
                      {librarySearchResults.map((libraryStrategy) => (
                        <button
                          key={libraryStrategy.id}
                          onClick={() => handleLibraryStrategyClick(libraryStrategy.id)}
                          className="w-full text-left px-2 py-2 rounded-lg hover:bg-card transition-colors"
                        >
                          <div className="text-base text-foreground truncate">
                            {libraryStrategy.name}
                          </div>
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
              {/* New Strategy Section */}
              <div className="border-b border-primary/20">
                <div className="flex items-center justify-between px-4 py-4">
                  <button
                    onClick={handleNewStrategy}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    <Plus className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-base font-semibold text-primary whitespace-nowrap">
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
                    <h3 className="text-base font-semibold text-primary whitespace-nowrap">
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
                  <div className="px-4 pb-4 space-y-1">
                    {isLoading ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="px-2 py-2 animate-pulse">
                            <div className="h-4 bg-muted rounded w-2/3" />
                          </div>
                        ))}
                      </>
                    ) : strategies.length === 0 ? (
                      <div className="text-center py-6 px-2">
                        <button
                          onClick={handleNewStrategy}
                          className="inline-flex items-center gap-2 text-md text-primary hover:opacity-80 transition-opacity"
                        >
                          <Plus className="h-4 w-4" />
                          Create your first strategy
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
                                className="w-full px-2 py-2 text-base bg-card border border-primary/40 rounded-lg focus:outline-none focus:border-primary text-foreground"
                              />
                            ) : (
                              <button
                                onClick={() => handleStrategyClick(strategyItem.id)}
                                className="w-full text-left px-2 py-2 rounded-lg hover:bg-card transition-colors"
                              >
                                <div className="text-base text-foreground truncate pr-16">
                                  {strategyItem.name}
                                </div>
                              </button>
                            )}

                            {isHovered && !isEditing && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditing(strategyItem.id, strategyItem.name)
                                  }}
                                  disabled={isDeleting}
                                  className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Rename strategy"
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(strategyItem.id, strategyItem.name)
                                  }}
                                  disabled={isDeleting || isThisDeleting}
                                  className="p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={isThisDeleting ? "Deleting..." : "Delete strategy"}
                                >
                                  <Trash2 className={`h-3 w-3 text-muted-foreground ${isThisDeleting ? 'animate-pulse' : ''}`} />
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

              {/* Library Section */}
              <div className="border-b border-primary/20">
                <button
                  onClick={() => setLibraryExpanded(!libraryExpanded)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-card/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="text-base font-semibold text-primary whitespace-nowrap">
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
                  <div className="px-4 pb-4 space-y-2">
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
            </>
          )}
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
            strategies.map((libraryStrategy) => (
              <button
                key={libraryStrategy.id}
                onClick={() => onStrategyClick(libraryStrategy.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-card transition-colors"
              >
                <div className="text-base text-foreground truncate">
                  {libraryStrategy.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
