'use client'

import React, { useMemo } from 'react'
import { useSharedViewport } from './SharedViewportContext'
import { Eye, EyeOff } from 'lucide-react'

interface GroupedIndicator {
  name: string
  displayName: string
  color: string
  visible: boolean
  panelId: string
  panelTitle: string
  isBollingerGroup: boolean
  bollingerNames?: string[]
}

export function IndicatorTogglePanel() {
  const { state, toggleIndicator } = useSharedViewport()

  // Group indicators (Bollinger Bands as 1 group)
  const groupedIndicators = useMemo(() => {
    const indicators: GroupedIndicator[] = []
    const bollingerGroups = new Map<string, { indicators: any[]; panelId: string; panelTitle: string }>()

    state.panels.forEach(panel => {
      panel.indicators.forEach(ind => {
        const name = ind.name.toLowerCase()

        // Check if Bollinger Band indicator
        if (name.includes('bollinger')) {
          // Extract base name (remove _upper, _middle, _lower)
          const baseName = name.replace(/_upper|_middle|_lower/g, '')

          if (!bollingerGroups.has(baseName)) {
            bollingerGroups.set(baseName, {
              indicators: [],
              panelId: panel.id,
              panelTitle: panel.title
            })
          }

          bollingerGroups.get(baseName)!.indicators.push(ind)
        } else {
          // Non-Bollinger indicator - add directly
          indicators.push({
            name: ind.name,
            displayName: ind.name,
            color: ind.color,
            visible: ind.visible,
            panelId: panel.id,
            panelTitle: panel.title,
            isBollingerGroup: false
          })
        }
      })
    })

    // Add Bollinger groups as single indicators
    bollingerGroups.forEach((group, baseName) => {
      // Get display name from first indicator
      const firstInd = group.indicators[0]
      const displayName = baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

      // Visible if ANY of the 3 bands is visible
      const anyVisible = group.indicators.some(ind => ind.visible)

      indicators.push({
        name: baseName,
        displayName,
        color: firstInd.color,
        visible: anyVisible,
        panelId: group.panelId,
        panelTitle: group.panelTitle,
        isBollingerGroup: true,
        bollingerNames: group.indicators.map(ind => ind.name)
      })
    })

    return indicators
  }, [state.panels])

  const handleToggle = (indicator: GroupedIndicator) => {
    if (indicator.isBollingerGroup && indicator.bollingerNames) {
      // Toggle all 3 Bollinger bands together
      indicator.bollingerNames.forEach(name => {
        toggleIndicator(name, indicator.panelId)
      })
    } else {
      // Regular indicator
      toggleIndicator(indicator.name, indicator.panelId)
    }
  }

  if (groupedIndicators.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
      <div className="w-full text-sm font-medium text-muted-foreground mb-1">
        Indicators
      </div>

      {groupedIndicators.map((indicator) => (
        <button
          key={`${indicator.panelId}-${indicator.name}`}
          onClick={() => handleToggle(indicator)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium
            transition-all duration-200
            ${indicator.visible
              ? 'bg-background border border-border shadow-sm'
              : 'bg-muted/50 text-muted-foreground border border-transparent'
            }
            hover:shadow-md
          `}
        >
          {indicator.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}

          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: indicator.color }}
          />

          <span>{indicator.displayName}</span>

          <span className="text-xs text-muted-foreground">
            ({indicator.panelTitle})
          </span>
        </button>
      ))}
    </div>
  )
}
