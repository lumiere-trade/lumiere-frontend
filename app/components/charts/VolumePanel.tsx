'use client'

import React, { useMemo } from 'react'
import { Panel } from './Panel'
import { VolumePanelRenderer } from './volumePanelRenderer'
import { PanelConfig } from './panelTypes'

interface VolumePanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function VolumePanel({ config, panelTop, panelHeight }: VolumePanelProps) {
  // Create renderer once
  const renderer = useMemo(() => {
    if (typeof window === 'undefined') return null
    const canvas = document.createElement('canvas')
    return new VolumePanelRenderer(canvas)
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
