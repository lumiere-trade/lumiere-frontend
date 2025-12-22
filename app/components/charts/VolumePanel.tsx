'use client'

import React, { useCallback } from 'react'
import { Panel } from './Panel'
import { VolumePanelRenderer } from './volumePanelRenderer'
import { PanelConfig } from './panelTypes'

interface VolumePanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function VolumePanel({ config, panelTop, panelHeight }: VolumePanelProps) {
  const createRenderer = useCallback((canvas: HTMLCanvasElement) => {
    return new VolumePanelRenderer(canvas)
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
