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

// Format indicator name to human readable
function formatIndicatorName(name: string): string {
  const lower = name.toLowerCase()
  
  // MACD: macd_12_26_9 -> MACD(12, 26, 9)
  if (lower.startsWith('macd_')) {
    const params = lower.match(/(\d+)_(\d+)_(\d+)/)
    if (params) {
      return `MACD(${params[1]}, ${params[2]}, ${params[3]})`
    }
  }
  
  // EMA: ema_20 -> EMA(20)
  if (lower.startsWith('ema_')) {
    const params = lower.match(/ema_(\d+)/)
    if (params) {
      return `EMA(${params[1]})`
    }
  }
  
  // SMA: sma_50 -> SMA(50)
  if (lower.startsWith('sma_')) {
    const params = lower.match(/sma_(\d+)/)
    if (params) {
      return `SMA(${params[1]})`
    }
  }
  
  // RSI: rsi_14 -> RSI(14)
  if (lower.startsWith('rsi_')) {
    const params = lower.match(/rsi_(\d+)/)
    if (params) {
      return `RSI(${params[1]})`
    }
  }
  
  // ADX: adx_14 -> ADX(14)
  if (lower.startsWith('adx_')) {
    const params = lower.match(/adx_(\d+)/)
    if (params) {
      return `ADX(${params[1]})`
    }
  }
  
  // Bollinger Bands: bollinger_20_2 -> Bollinger Bands(20, 2)
  if (lower.includes('bollinger')) {
    const params = lower.match(/(\d+)_(\d+)/)
    if (params) {
      return `Bollinger Bands(${params[1]}, ${params[2]})`
    }
  }
  
  // Stochastic: stochastic_14_3_3 -> Stochastic(14, 3, 3)
  if (lower.startsWith('stochastic_')) {
    const params = lower.match(/(\d+)_(\d+)_(\d+)/)
    if (params) {
      return `Stochastic(${params[1]}, ${params[2]}, ${params[3]})`
    }
  }
  
  // ATR: atr_14 -> ATR(14)
  if (lower.startsWith('atr_')) {
    const params = lower.match(/atr_(\d+)/)
    if (params) {
      return `ATR(${params[1]})`
    }
  }
  
  // Volume: volume -> Volume
  if (lower === 'volume') {
    return 'Volume'
  }
  
  // Default: Title Case
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
        // Check if MACD indicator (including histogram with different format)
        else if (name.includes('macd')) {
          // Extract parameters from any MACD format:
          // macd_12_26_9 -> 12, 26, 9
          // macd_signal_12_26_9 -> 12, 26, 9
          // macd_histogram(12, 26, 9) -> 12, 26, 9
          const paramsMatch = name.match(/(\d+)[_,\s]+(\d+)[_,\s]+(\d+)/)
          
          if (paramsMatch) {
            // Use consistent base name for all variants
            const baseName = `macd_${paramsMatch[1]}_${paramsMatch[2]}_${paramsMatch[3]}`

            if (!macdGroups.has(baseName)) {
              macdGroups.set(baseName, {
                indicators: [],
                panelId: panel.id,
                panelTitle: panel.title
              })
            }

            macdGroups.get(baseName)!.indicators.push(ind)
          }
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
          // Non-grouped indicator - add directly with formatted name
          indicators.push({
            name: ind.name,
            displayName: formatIndicatorName(ind.name),
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
      const displayName = formatIndicatorName(baseName)
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
      const displayName = formatIndicatorName(baseName)
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
      const displayName = formatIndicatorName(baseName)
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
      const displayName = formatIndicatorName(baseName)
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
      <div className="w-full text-md font-semibold text-muted-foreground mb-1">
        Indicators
      </div>

      {groupedIndicators.map((indicator) => (
        <button
          key={`${indicator.panelId}-${indicator.name}`}
          onClick={() => handleToggle(indicator)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded text-md font-semibold
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
