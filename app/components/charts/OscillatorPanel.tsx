'use client'

import React, { useMemo } from 'react'
import { Panel } from './Panel'
import { OscillatorPanelRenderer } from './oscillatorPanelRenderer'
import { PanelConfig } from './panelTypes'

interface OscillatorPanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function OscillatorPanel({ config, panelTop, panelHeight }: OscillatorPanelProps) {
  // Create renderer once
  const renderer = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    return new OscillatorPanelRenderer(canvas)
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
