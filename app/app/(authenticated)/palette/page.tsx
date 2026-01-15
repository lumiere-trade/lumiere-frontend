"use client"

import { useState } from 'react'

const palettes = {
  current: {
    name: "Current (Розовееща)",
    description: "Hue 50-60 с ниска chroma - праскова подтон",
    colors: {
      background: "oklch(0.98 0.01 60)",
      foreground: "oklch(0.40 0.03 50)",
      card: "oklch(0.95 0.01 60)",
      primary: "oklch(0.50 0.06 50)",
      secondary: "oklch(0.88 0.02 60)",
      muted: "oklch(0.90 0.02 60)",
      mutedForeground: "oklch(0.45 0.03 40)",
      border: "oklch(0.85 0.02 60)",
      accent: "oklch(0.50 0.06 50)",
    }
  },
  warmNeutral: {
    name: "Warm Neutral",
    description: "Hue 80-90 (жълто) - топло без розово",
    colors: {
      background: "oklch(0.98 0.008 85)",
      foreground: "oklch(0.35 0.02 70)",
      card: "oklch(0.96 0.01 85)",
      primary: "oklch(0.45 0.08 75)",
      secondary: "oklch(0.92 0.015 85)",
      muted: "oklch(0.94 0.012 85)",
      mutedForeground: "oklch(0.50 0.02 70)",
      border: "oklch(0.88 0.015 85)",
      accent: "oklch(0.55 0.10 75)",
    }
  },
  sandstone: {
    name: "Sandstone",
    description: "Hue 70-80 - пясъчен камък, земни тонове",
    colors: {
      background: "oklch(0.97 0.012 75)",
      foreground: "oklch(0.30 0.03 60)",
      card: "oklch(0.94 0.015 75)",
      primary: "oklch(0.48 0.09 65)",
      secondary: "oklch(0.90 0.018 75)",
      muted: "oklch(0.92 0.015 75)",
      mutedForeground: "oklch(0.48 0.025 60)",
      border: "oklch(0.86 0.02 75)",
      accent: "oklch(0.52 0.11 65)",
    }
  },
  honey: {
    name: "Honey Gold",
    description: "Hue 85-95 - меден златист, premium feel",
    colors: {
      background: "oklch(0.98 0.01 90)",
      foreground: "oklch(0.32 0.04 80)",
      card: "oklch(0.95 0.015 90)",
      primary: "oklch(0.55 0.12 85)",
      secondary: "oklch(0.91 0.02 90)",
      muted: "oklch(0.93 0.015 90)",
      mutedForeground: "oklch(0.50 0.03 80)",
      border: "oklch(0.87 0.02 90)",
      accent: "oklch(0.60 0.14 85)",
    }
  },
  warmGray: {
    name: "Warm Gray",
    description: "Hue 70 с много ниска chroma - професионален",
    colors: {
      background: "oklch(0.98 0.005 70)",
      foreground: "oklch(0.28 0.015 60)",
      card: "oklch(0.95 0.008 70)",
      primary: "oklch(0.45 0.06 70)",
      secondary: "oklch(0.91 0.008 70)",
      muted: "oklch(0.93 0.006 70)",
      mutedForeground: "oklch(0.50 0.015 60)",
      border: "oklch(0.87 0.01 70)",
      accent: "oklch(0.50 0.08 70)",
    }
  },
  olive: {
    name: "Olive Cream",
    description: "Hue 100-110 - маслинено зелено, природен",
    colors: {
      background: "oklch(0.97 0.012 105)",
      foreground: "oklch(0.30 0.03 100)",
      card: "oklch(0.94 0.015 105)",
      primary: "oklch(0.48 0.08 100)",
      secondary: "oklch(0.90 0.015 105)",
      muted: "oklch(0.92 0.012 105)",
      mutedForeground: "oklch(0.48 0.02 100)",
      border: "oklch(0.86 0.018 105)",
      accent: "oklch(0.52 0.10 100)",
    }
  },
  caramel: {
    name: "Caramel",
    description: "Hue 65-75 - карамел, богат и топъл",
    colors: {
      background: "oklch(0.97 0.015 70)",
      foreground: "oklch(0.28 0.035 55)",
      card: "oklch(0.93 0.02 70)",
      primary: "oklch(0.50 0.10 60)",
      secondary: "oklch(0.88 0.025 70)",
      muted: "oklch(0.91 0.02 70)",
      mutedForeground: "oklch(0.48 0.03 55)",
      border: "oklch(0.84 0.025 70)",
      accent: "oklch(0.55 0.12 60)",
    }
  },
  parchment: {
    name: "Parchment",
    description: "Hue 80 - стар пергамент, класически",
    colors: {
      background: "oklch(0.96 0.018 80)",
      foreground: "oklch(0.30 0.025 65)",
      card: "oklch(0.93 0.022 80)",
      primary: "oklch(0.48 0.08 70)",
      secondary: "oklch(0.89 0.02 80)",
      muted: "oklch(0.91 0.018 80)",
      mutedForeground: "oklch(0.48 0.022 65)",
      border: "oklch(0.85 0.022 80)",
      accent: "oklch(0.52 0.10 70)",
    }
  }
}

type PaletteKey = keyof typeof palettes

interface DashboardMockProps {
  colors: typeof palettes.current.colors
}

function DashboardMock({ colors }: DashboardMockProps) {
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg border"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }}
    >
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }}
      >
        <span style={{ color: colors.foreground }} className="font-semibold text-sm">
          LUMIERE
        </span>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 rounded-md text-xs font-medium"
            style={{ 
              backgroundColor: colors.secondary,
              color: colors.foreground 
            }}
          >
            DASHBOARD
          </button>
          <button 
            className="px-3 py-1 rounded-md text-xs font-medium"
            style={{ 
              backgroundColor: colors.primary,
              color: colors.background 
            }}
          >
            CREATE
          </button>
        </div>
      </div>

      <div className="p-4 flex gap-3">
        <div 
          className="w-32 rounded-lg p-3"
          style={{ backgroundColor: colors.card }}
        >
          <div style={{ color: colors.mutedForeground }} className="text-xs mb-2">
            Strategies
          </div>
          <div 
            className="text-xs py-1.5 px-2 rounded"
            style={{ 
              backgroundColor: colors.muted,
              color: colors.foreground 
            }}
          >
            RSI Momentum
          </div>
          <div 
            className="text-xs py-1.5 px-2 mt-1 rounded"
            style={{ color: colors.mutedForeground }}
          >
            Breakout
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Equity', value: '$10,000.00' },
              { label: "Today's P&L", value: '+$0.00' },
              { label: 'Position', value: 'FLAT' }
            ].map((stat, i) => (
              <div 
                key={i}
                className="rounded-lg p-3"
                style={{ backgroundColor: colors.card }}
              >
                <div style={{ color: colors.mutedForeground }} className="text-xs">
                  {stat.label}
                </div>
                <div style={{ color: colors.foreground }} className="font-semibold text-sm mt-1">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div 
            className="rounded-lg p-3 h-24"
            style={{ backgroundColor: colors.card }}
          >
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: colors.foreground }} className="text-xs font-medium">
                SOL/USDC - 5m
              </span>
              <span style={{ color: colors.mutedForeground }} className="text-xs">
                500 candles
              </span>
            </div>
            <div className="h-12 flex items-end gap-0.5">
              {[40, 45, 35, 55, 50, 60, 45, 70, 65, 75, 60, 55, 65, 70, 68].map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ 
                    height: `${h}%`,
                    backgroundColor: i % 3 === 0 ? colors.accent : colors.muted 
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div 
          className="w-36 rounded-lg p-3"
          style={{ backgroundColor: colors.card }}
        >
          <div style={{ color: colors.mutedForeground }} className="text-xs mb-2">
            Active Strategy
          </div>
          <div style={{ color: colors.foreground }} className="text-sm font-medium">
            RSI Momentum
          </div>
          <div style={{ color: colors.mutedForeground }} className="text-xs mt-1">
            SOL/USDC / 5m
          </div>
          <div className="flex gap-1 mt-3">
            <button 
              className="flex-1 py-1 text-xs rounded"
              style={{ 
                backgroundColor: colors.secondary,
                color: colors.foreground 
              }}
            >
              Pause
            </button>
            <button 
              className="flex-1 py-1 text-xs rounded"
              style={{ 
                backgroundColor: colors.muted,
                color: colors.accent 
              }}
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaletteExplorerPage() {
  const [selected, setSelected] = useState<PaletteKey>('current')
  const [compareWith, setCompareWith] = useState<PaletteKey>('warmNeutral')
  const [copiedCSS, setCopiedCSS] = useState(false)

  const palette = palettes[selected]
  const comparePalette = palettes[compareWith]

  const generateCSS = (pal: typeof palette) => `:root {
  --background: ${pal.colors.background};
  --foreground: ${pal.colors.foreground};
  --card: ${pal.colors.card};
  --card-foreground: ${pal.colors.foreground};
  --popover: ${pal.colors.card};
  --popover-foreground: ${pal.colors.foreground};
  --primary: ${pal.colors.primary};
  --primary-foreground: ${pal.colors.background};
  --secondary: ${pal.colors.secondary};
  --secondary-foreground: ${pal.colors.foreground};
  --muted: ${pal.colors.muted};
  --muted-foreground: ${pal.colors.mutedForeground};
  --accent: ${pal.colors.accent};
  --accent-foreground: ${pal.colors.background};
  --border: ${pal.colors.border};
  --input: ${pal.colors.muted};
  --ring: ${pal.colors.primary};
  --sidebar: ${pal.colors.card};
  --sidebar-foreground: ${pal.colors.foreground};
  --sidebar-primary: ${pal.colors.primary};
  --sidebar-primary-foreground: ${pal.colors.background};
  --sidebar-accent: ${pal.colors.muted};
  --sidebar-accent-foreground: ${pal.colors.foreground};
  --sidebar-border: ${pal.colors.border};
  --sidebar-ring: ${pal.colors.primary};
}`

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(generateCSS(comparePalette))
    setCopiedCSS(true)
    setTimeout(() => setCopiedCSS(false), 2000)
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Lumiere Light Theme - Palette Explorer
          </h1>
          <p className="text-neutral-600">
            Избери палитри за сравнение. Търсим топли тонове без розов подтон.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Основна палитра
            </label>
            <select 
              value={selected}
              onChange={(e) => setSelected(e.target.value as PaletteKey)}
              className="w-full p-2 rounded-lg border border-neutral-300 bg-white text-neutral-800"
            >
              {Object.entries(palettes).map(([key, p]) => (
                <option key={key} value={key}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">{palette.description}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Сравни с
            </label>
            <select 
              value={compareWith}
              onChange={(e) => setCompareWith(e.target.value as PaletteKey)}
              className="w-full p-2 rounded-lg border border-neutral-300 bg-white text-neutral-800"
            >
              {Object.entries(palettes).map(([key, p]) => (
                <option key={key} value={key}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">{comparePalette.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">{palette.name}</h3>
            <DashboardMock colors={palette.colors} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">{comparePalette.name}</h3>
            <DashboardMock colors={comparePalette.colors} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow mb-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Color Tokens Comparison</h3>
          <div className="grid grid-cols-2 gap-8">
            {[
              { key: selected, pal: palette },
              { key: compareWith, pal: comparePalette }
            ].map(({ key, pal }) => (
              <div key={key}>
                <h4 className="text-sm font-medium text-neutral-600 mb-3">{pal.name}</h4>
                <div className="space-y-2">
                  {Object.entries(pal.colors).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-3">
                      <div 
                        className="w-10 h-6 rounded border border-neutral-200"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-neutral-600 w-28">{name}</span>
                      <code className="text-xs text-neutral-400 font-mono">{color}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-6 text-green-400 font-mono text-xs overflow-x-auto mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-neutral-400">/* {comparePalette.name} - CSS Variables */</span>
            <button
              onClick={handleCopyCSS}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded text-xs transition-colors"
            >
              {copiedCSS ? 'Copied!' : 'Copy CSS'}
            </button>
          </div>
          <pre className="select-text">{generateCSS(comparePalette)}</pre>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-2">Препоръки</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li><strong>Warm Neutral</strong> - Най-балансиран, премахва розовото без да става студен</li>
            <li><strong>Sandstone</strong> - По-земен, природен, добър за trading app</li>
            <li><strong>Honey Gold</strong> - Premium feel, леко златисто, без розово</li>
            <li><strong>Warm Gray</strong> - Най-професионален, минимална chroma, чист</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
