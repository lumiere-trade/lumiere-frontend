'use client'

import React, { useCallback } from 'react'
import { Panel } from './Panel'
import { PricePanelRenderer } from './pricePanelRenderer'
import { PanelConfig } from './panelTypes'

interface PricePanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function PricePanel({ config, panelTop, panelHeight }: PricePanelProps) {
  const createRenderer = useCallback((canvas: HTMLCanvasElement) => {
    return new PricePanelRenderer(canvas)
  }, [])

  return (
    <Panel
      config={config}
      panelTop={panelTop}
      panelHeight={panelHeight}
      createRenderer={createRenderer}
    />
  )
}
