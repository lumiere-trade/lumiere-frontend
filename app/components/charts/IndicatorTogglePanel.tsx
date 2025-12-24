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
  isGrouped: boolean
  groupType?: 'bollinger' | 'macd' | 'volume' | 'stochastic'
  groupNames?: string[]
}

export function IndicatorTogglePanel() {
  const { state, toggleIndicator } = useSharedViewport()

  // Group indicators (Bollinger, MACD, Volume, Stochastic as groups)
  const groupedIndicators = useMemo(() => {
    const indicators: GroupedIndicator[] = []
    const bollingerGroups = new Map<string, { indicators: any[]; panelId: string; panelTitle: string }>()
    const macdGroups = new Map<string, { indicators: any[]; panelId: string; panelTitle: string }>()
    const volumeGroups = new Map<string, { indicators: any[]; panelId: string; panelTitle: string }>()
    const stochasticGroups = new Map<string, { indicators: any[]; panelId: string; panelTitle: string }>()

    state.panels.forEach(panel => {
      panel.indicators.forEach(ind => {
        const name = ind.name.toLowerCase()

        // Check if Bollinger Band indicator
        if (name.includes('bollinger')) {
          const baseName = name.replace(/_upper|_middle|_lower/g, '')

          if (!bollingerGroups.has(baseName)) {
            bollingerGroups.set(baseName, {
              indicators: [],
              panelId: panel.id,
              panelTitle: panel.title
            })
          }

          bollingerGroups.get(baseName)!.indicators.push(ind)
        }
        // Check if MACD indicator
        else if (name.includes('macd')) {
          const baseName = name.replace(/_signal/g, '')

          if (!macdGroups.has(baseName)) {
            macdGroups.set(baseName, {
              indicators: [],
              panelId: panel.id,
              panelTitle: panel.title
            })
          }

          macdGroups.get(baseName)!.indicators.push(ind)
        }
        // Check if Stochastic indicator
        else if (name.includes('stochastic')) {
          const baseName = name.replace(/_k|_d/g, '')

          if (!stochasticGroups.has(baseName)) {
            stochasticGroups.set(baseName, {
              indicators: [],
              panelId: panel.id,
              panelTitle: panel.title
            })
          }

          stochasticGroups.get(baseName)!.indicators.push(ind)
        }
        // Check if Volume indicator (volume or volume_sma_*)
        else if (name.startsWith('volume')) {
          const baseName = 'volume' // Group all volume variants under "volume"

          if (!volumeGroups.has(baseName)) {
            volumeGroups.set(baseName, {
              indicators: [],
              panelId: panel.id,
              panelTitle: panel.title
            })
          }

          volumeGroups.get(baseName)!.indicators.push(ind)
        }
        else {
          // Non-grouped indicator - add directly
          indicators.push({
            name: ind.name,
            displayName: ind.name,
            color: ind.color,
            visible: ind.visible,
            panelId: panel.id,
            panelTitle: panel.title,
            isGrouped: false
          })
        }
      })
    })

    // Add Bollinger groups
    bollingerGroups.forEach((group, baseName) => {
      const firstInd = group.indicators[0]
      const displayName = baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const anyVisible = group.indicators.some(ind => ind.visible)

      indicators.push({
        name: baseName,
        displayName,
        color: firstInd.color,
        visible: anyVisible,
        panelId: group.panelId,
        panelTitle: group.panelTitle,
        isGrouped: true,
        groupType: 'bollinger',
        groupNames: group.indicators.map(ind => ind.name)
      })
    })

    // Add MACD groups
    macdGroups.forEach((group, baseName) => {
      const firstInd = group.indicators[0]
      const displayName = baseName.replace(/_/g, ' ').toUpperCase()
      const anyVisible = group.indicators.some(ind => ind.visible)

      indicators.push({
        name: baseName,
        displayName,
        color: firstInd.color,
        visible: anyVisible,
        panelId: group.panelId,
        panelTitle: group.panelTitle,
        isGrouped: true,
        groupType: 'macd',
        groupNames: group.indicators.map(ind => ind.name)
      })
    })

    // Add Stochastic groups
    stochasticGroups.forEach((group, baseName) => {
      const firstInd = group.indicators[0]
      const displayName = baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const anyVisible = group.indicators.some(ind => ind.visible)

      indicators.push({
        name: baseName,
        displayName,
        color: firstInd.color,
        visible: anyVisible,
        panelId: group.panelId,
        panelTitle: group.panelTitle,
        isGrouped: true,
        groupType: 'stochastic',
        groupNames: group.indicators.map(ind => ind.name)
      })
    })

    // Add Volume groups
    volumeGroups.forEach((group, baseName) => {
      const firstInd = group.indicators[0]
      const displayName = 'Volume' // Clean display name
      const anyVisible = group.indicators.some(ind => ind.visible)

      indicators.push({
        name: baseName,
        displayName,
        color: firstInd.color,
        visible: anyVisible,
        panelId: group.panelId,
        panelTitle: group.panelTitle,
        isGrouped: true,
        groupType: 'volume',
        groupNames: group.indicators.map(ind => ind.name)
      })
    })

    return indicators
  }, [state.panels])

  const handleToggle = (indicator: GroupedIndicator) => {
    if (indicator.isGrouped && indicator.groupNames) {
      // Toggle all grouped indicators together
      indicator.groupNames.forEach(name => {
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
