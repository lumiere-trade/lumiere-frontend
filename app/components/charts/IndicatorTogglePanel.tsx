'use client'

import React from 'react'
import { useSharedViewport } from './SharedViewportContext'
import { Eye, EyeOff } from 'lucide-react'

export function IndicatorTogglePanel() {
  const { state, toggleIndicator } = useSharedViewport()

  // Collect all indicators from all panels
  const allIndicators = state.panels.flatMap(panel =>
    panel.indicators.map(ind => ({
      ...ind,
      panelId: panel.id,
      panelTitle: panel.title
    }))
  )

  if (allIndicators.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
      <div className="w-full text-xs font-medium text-muted-foreground mb-1">
        Indicators
      </div>
      
      {allIndicators.map((indicator) => (
        <button
          key={`${indicator.panelId}-${indicator.name}`}
          onClick={() => toggleIndicator(indicator.name, indicator.panelId)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium
            transition-all duration-200
            ${indicator.visible
              ? 'bg-background border border-border shadow-sm'
              : 'bg-muted/50 text-muted-foreground border border-transparent'
            }
            hover:shadow-md
          `}
        >
          {indicator.visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: indicator.color }}
          />
          
          <span>{indicator.name}</span>
          
          <span className="text-[10px] text-muted-foreground">
            ({indicator.panelTitle})
          </span>
        </button>
      ))}
    </div>
  )
}
