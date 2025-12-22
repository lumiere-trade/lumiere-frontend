'use client'

import React, { useCallback } from 'react'
import { Panel } from './Panel'
import { OscillatorPanelRenderer } from './oscillatorPanelRenderer'
import { PanelConfig } from './panelTypes'

interface OscillatorPanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function OscillatorPanel({ config, panelTop, panelHeight }: OscillatorPanelProps) {
  const createRenderer = useCallback((canvas: HTMLCanvasElement) => {
    return new OscillatorPanelRenderer(canvas)
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
