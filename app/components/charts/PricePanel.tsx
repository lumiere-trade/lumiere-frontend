'use client'

import React, { useMemo } from 'react'
import { Panel } from './Panel'
import { PricePanelRenderer } from './pricePanelRenderer'
import { PanelConfig } from './panelTypes'

interface PricePanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function PricePanel({ config, panelTop, panelHeight }: PricePanelProps) {
  // Create renderer once
  const renderer = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    return new PricePanelRenderer(canvas)
  }, [])

  if (!renderer) return null

  return (
    <Panel
      config={config}
      panelTop={panelTop}
      panelHeight={panelHeight}
      renderer={renderer}
    />
  )
}
