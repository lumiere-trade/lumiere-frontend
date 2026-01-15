"use client"

import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { Button } from '@lumiere/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const palettes = {
  current: {
    name: "Current",
    description: "Сегашна (розовееща)",
    colors: {
      background: "oklch(0.98 0.01 60)",
      foreground: "oklch(0.40 0.03 50)",
      card: "oklch(0.95 0.01 60)",
      cardForeground: "oklch(0.40 0.03 50)",
      popover: "oklch(0.95 0.01 60)",
      popoverForeground: "oklch(0.40 0.03 50)",
      primary: "oklch(0.50 0.06 50)",
      primaryForeground: "oklch(0.98 0.01 60)",
      secondary: "oklch(0.88 0.02 60)",
      secondaryForeground: "oklch(0.40 0.03 50)",
      muted: "oklch(0.90 0.02 60)",
      mutedForeground: "oklch(0.45 0.03 40)",
      accent: "oklch(0.50 0.06 50)",
      accentForeground: "oklch(0.98 0.01 60)",
      border: "oklch(0.85 0.02 60)",
      input: "oklch(0.90 0.02 60)",
      ring: "oklch(0.50 0.06 50)",
      sidebar: "oklch(0.95 0.01 60)",
      sidebarForeground: "oklch(0.40 0.03 50)",
      sidebarPrimary: "oklch(0.50 0.06 50)",
      sidebarPrimaryForeground: "oklch(0.98 0.01 60)",
      sidebarAccent: "oklch(0.90 0.02 60)",
      sidebarAccentForeground: "oklch(0.40 0.03 50)",
      sidebarBorder: "oklch(0.85 0.02 60)",
      sidebarRing: "oklch(0.50 0.06 50)",
    }
  },
  warmNeutral: {
    name: "Warm Neutral",
    description: "Топло без розово",
    colors: {
      background: "oklch(0.98 0.008 85)",
      foreground: "oklch(0.35 0.02 70)",
      card: "oklch(0.96 0.01 85)",
      cardForeground: "oklch(0.35 0.02 70)",
      popover: "oklch(0.96 0.01 85)",
      popoverForeground: "oklch(0.35 0.02 70)",
      primary: "oklch(0.45 0.08 75)",
      primaryForeground: "oklch(0.98 0.008 85)",
      secondary: "oklch(0.92 0.015 85)",
      secondaryForeground: "oklch(0.35 0.02 70)",
      muted: "oklch(0.94 0.012 85)",
      mutedForeground: "oklch(0.50 0.02 70)",
      accent: "oklch(0.55 0.10 75)",
      accentForeground: "oklch(0.98 0.008 85)",
      border: "oklch(0.88 0.015 85)",
      input: "oklch(0.94 0.012 85)",
      ring: "oklch(0.45 0.08 75)",
      sidebar: "oklch(0.96 0.01 85)",
      sidebarForeground: "oklch(0.35 0.02 70)",
      sidebarPrimary: "oklch(0.45 0.08 75)",
      sidebarPrimaryForeground: "oklch(0.98 0.008 85)",
      sidebarAccent: "oklch(0.94 0.012 85)",
      sidebarAccentForeground: "oklch(0.35 0.02 70)",
      sidebarBorder: "oklch(0.88 0.015 85)",
      sidebarRing: "oklch(0.45 0.08 75)",
    }
  },
  sandstone: {
    name: "Sandstone",
    description: "Земни тонове",
    colors: {
      background: "oklch(0.97 0.012 75)",
      foreground: "oklch(0.30 0.03 60)",
      card: "oklch(0.94 0.015 75)",
      cardForeground: "oklch(0.30 0.03 60)",
      popover: "oklch(0.94 0.015 75)",
      popoverForeground: "oklch(0.30 0.03 60)",
      primary: "oklch(0.48 0.09 65)",
      primaryForeground: "oklch(0.97 0.012 75)",
      secondary: "oklch(0.90 0.018 75)",
      secondaryForeground: "oklch(0.30 0.03 60)",
      muted: "oklch(0.92 0.015 75)",
      mutedForeground: "oklch(0.48 0.025 60)",
      accent: "oklch(0.52 0.11 65)",
      accentForeground: "oklch(0.97 0.012 75)",
      border: "oklch(0.86 0.02 75)",
      input: "oklch(0.92 0.015 75)",
      ring: "oklch(0.48 0.09 65)",
      sidebar: "oklch(0.94 0.015 75)",
      sidebarForeground: "oklch(0.30 0.03 60)",
      sidebarPrimary: "oklch(0.48 0.09 65)",
      sidebarPrimaryForeground: "oklch(0.97 0.012 75)",
      sidebarAccent: "oklch(0.92 0.015 75)",
      sidebarAccentForeground: "oklch(0.30 0.03 60)",
      sidebarBorder: "oklch(0.86 0.02 75)",
      sidebarRing: "oklch(0.48 0.09 65)",
    }
  },
  honey: {
    name: "Honey Gold",
    description: "Меден, premium",
    colors: {
      background: "oklch(0.98 0.01 90)",
      foreground: "oklch(0.32 0.04 80)",
      card: "oklch(0.95 0.015 90)",
      cardForeground: "oklch(0.32 0.04 80)",
      popover: "oklch(0.95 0.015 90)",
      popoverForeground: "oklch(0.32 0.04 80)",
      primary: "oklch(0.55 0.12 85)",
      primaryForeground: "oklch(0.98 0.01 90)",
      secondary: "oklch(0.91 0.02 90)",
      secondaryForeground: "oklch(0.32 0.04 80)",
      muted: "oklch(0.93 0.015 90)",
      mutedForeground: "oklch(0.50 0.03 80)",
      accent: "oklch(0.60 0.14 85)",
      accentForeground: "oklch(0.98 0.01 90)",
      border: "oklch(0.87 0.02 90)",
      input: "oklch(0.93 0.015 90)",
      ring: "oklch(0.55 0.12 85)",
      sidebar: "oklch(0.95 0.015 90)",
      sidebarForeground: "oklch(0.32 0.04 80)",
      sidebarPrimary: "oklch(0.55 0.12 85)",
      sidebarPrimaryForeground: "oklch(0.98 0.01 90)",
      sidebarAccent: "oklch(0.93 0.015 90)",
      sidebarAccentForeground: "oklch(0.32 0.04 80)",
      sidebarBorder: "oklch(0.87 0.02 90)",
      sidebarRing: "oklch(0.55 0.12 85)",
    }
  },
  warmGray: {
    name: "Warm Gray",
    description: "Професионален",
    colors: {
      background: "oklch(0.98 0.005 70)",
      foreground: "oklch(0.28 0.015 60)",
      card: "oklch(0.95 0.008 70)",
      cardForeground: "oklch(0.28 0.015 60)",
      popover: "oklch(0.95 0.008 70)",
      popoverForeground: "oklch(0.28 0.015 60)",
      primary: "oklch(0.45 0.06 70)",
      primaryForeground: "oklch(0.98 0.005 70)",
      secondary: "oklch(0.91 0.008 70)",
      secondaryForeground: "oklch(0.28 0.015 60)",
      muted: "oklch(0.93 0.006 70)",
      mutedForeground: "oklch(0.50 0.015 60)",
      accent: "oklch(0.50 0.08 70)",
      accentForeground: "oklch(0.98 0.005 70)",
      border: "oklch(0.87 0.01 70)",
      input: "oklch(0.93 0.006 70)",
      ring: "oklch(0.45 0.06 70)",
      sidebar: "oklch(0.95 0.008 70)",
      sidebarForeground: "oklch(0.28 0.015 60)",
      sidebarPrimary: "oklch(0.45 0.06 70)",
      sidebarPrimaryForeground: "oklch(0.98 0.005 70)",
      sidebarAccent: "oklch(0.93 0.006 70)",
      sidebarAccentForeground: "oklch(0.28 0.015 60)",
      sidebarBorder: "oklch(0.87 0.01 70)",
      sidebarRing: "oklch(0.45 0.06 70)",
    }
  },
  olive: {
    name: "Olive Cream",
    description: "Маслинено зелено",
    colors: {
      background: "oklch(0.97 0.012 105)",
      foreground: "oklch(0.30 0.03 100)",
      card: "oklch(0.94 0.015 105)",
      cardForeground: "oklch(0.30 0.03 100)",
      popover: "oklch(0.94 0.015 105)",
      popoverForeground: "oklch(0.30 0.03 100)",
      primary: "oklch(0.48 0.08 100)",
      primaryForeground: "oklch(0.97 0.012 105)",
      secondary: "oklch(0.90 0.015 105)",
      secondaryForeground: "oklch(0.30 0.03 100)",
      muted: "oklch(0.92 0.012 105)",
      mutedForeground: "oklch(0.48 0.02 100)",
      accent: "oklch(0.52 0.10 100)",
      accentForeground: "oklch(0.97 0.012 105)",
      border: "oklch(0.86 0.018 105)",
      input: "oklch(0.92 0.012 105)",
      ring: "oklch(0.48 0.08 100)",
      sidebar: "oklch(0.94 0.015 105)",
      sidebarForeground: "oklch(0.30 0.03 100)",
      sidebarPrimary: "oklch(0.48 0.08 100)",
      sidebarPrimaryForeground: "oklch(0.97 0.012 105)",
      sidebarAccent: "oklch(0.92 0.012 105)",
      sidebarAccentForeground: "oklch(0.30 0.03 100)",
      sidebarBorder: "oklch(0.86 0.018 105)",
      sidebarRing: "oklch(0.48 0.08 100)",
    }
  },
  caramel: {
    name: "Caramel",
    description: "Карамел, богат",
    colors: {
      background: "oklch(0.97 0.015 70)",
      foreground: "oklch(0.28 0.035 55)",
      card: "oklch(0.93 0.02 70)",
      cardForeground: "oklch(0.28 0.035 55)",
      popover: "oklch(0.93 0.02 70)",
      popoverForeground: "oklch(0.28 0.035 55)",
      primary: "oklch(0.50 0.10 60)",
      primaryForeground: "oklch(0.97 0.015 70)",
      secondary: "oklch(0.88 0.025 70)",
      secondaryForeground: "oklch(0.28 0.035 55)",
      muted: "oklch(0.91 0.02 70)",
      mutedForeground: "oklch(0.48 0.03 55)",
      accent: "oklch(0.55 0.12 60)",
      accentForeground: "oklch(0.97 0.015 70)",
      border: "oklch(0.84 0.025 70)",
      input: "oklch(0.91 0.02 70)",
      ring: "oklch(0.50 0.10 60)",
      sidebar: "oklch(0.93 0.02 70)",
      sidebarForeground: "oklch(0.28 0.035 55)",
      sidebarPrimary: "oklch(0.50 0.10 60)",
      sidebarPrimaryForeground: "oklch(0.97 0.015 70)",
      sidebarAccent: "oklch(0.91 0.02 70)",
      sidebarAccentForeground: "oklch(0.28 0.035 55)",
      sidebarBorder: "oklch(0.84 0.025 70)",
      sidebarRing: "oklch(0.50 0.10 60)",
    }
  },
  parchment: {
    name: "Parchment",
    description: "Класически пергамент",
    colors: {
      background: "oklch(0.96 0.018 80)",
      foreground: "oklch(0.30 0.025 65)",
      card: "oklch(0.93 0.022 80)",
      cardForeground: "oklch(0.30 0.025 65)",
      popover: "oklch(0.93 0.022 80)",
      popoverForeground: "oklch(0.30 0.025 65)",
      primary: "oklch(0.48 0.08 70)",
      primaryForeground: "oklch(0.96 0.018 80)",
      secondary: "oklch(0.89 0.02 80)",
      secondaryForeground: "oklch(0.30 0.025 65)",
      muted: "oklch(0.91 0.018 80)",
      mutedForeground: "oklch(0.48 0.022 65)",
      accent: "oklch(0.52 0.10 70)",
      accentForeground: "oklch(0.96 0.018 80)",
      border: "oklch(0.85 0.022 80)",
      input: "oklch(0.91 0.018 80)",
      ring: "oklch(0.48 0.08 70)",
      sidebar: "oklch(0.93 0.022 80)",
      sidebarForeground: "oklch(0.30 0.025 65)",
      sidebarPrimary: "oklch(0.48 0.08 70)",
      sidebarPrimaryForeground: "oklch(0.96 0.018 80)",
      sidebarAccent: "oklch(0.91 0.018 80)",
      sidebarAccentForeground: "oklch(0.30 0.025 65)",
      sidebarBorder: "oklch(0.85 0.022 80)",
      sidebarRing: "oklch(0.48 0.08 70)",
    }
  }
}

type PaletteKey = keyof typeof palettes

const STORAGE_KEY = 'lumiere-palette'

export function PaletteToggle() {
  const [currentPalette, setCurrentPalette] = useState<PaletteKey>('current')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY) as PaletteKey | null
    if (saved && palettes[saved]) {
      setCurrentPalette(saved)
      applyPalette(saved)
    }
  }, [])

  const applyPalette = (key: PaletteKey) => {
    const palette = palettes[key]
    const root = document.documentElement

    // Only apply in light mode
    if (root.classList.contains('dark')) return

    const cssVarMap: Record<string, keyof typeof palette.colors> = {
      '--background': 'background',
      '--foreground': 'foreground',
      '--card': 'card',
      '--card-foreground': 'cardForeground',
      '--popover': 'popover',
      '--popover-foreground': 'popoverForeground',
      '--primary': 'primary',
      '--primary-foreground': 'primaryForeground',
      '--secondary': 'secondary',
      '--secondary-foreground': 'secondaryForeground',
      '--muted': 'muted',
      '--muted-foreground': 'mutedForeground',
      '--accent': 'accent',
      '--accent-foreground': 'accentForeground',
      '--border': 'border',
      '--input': 'input',
      '--ring': 'ring',
      '--sidebar': 'sidebar',
      '--sidebar-foreground': 'sidebarForeground',
      '--sidebar-primary': 'sidebarPrimary',
      '--sidebar-primary-foreground': 'sidebarPrimaryForeground',
      '--sidebar-accent': 'sidebarAccent',
      '--sidebar-accent-foreground': 'sidebarAccentForeground',
      '--sidebar-border': 'sidebarBorder',
      '--sidebar-ring': 'sidebarRing',
    }

    Object.entries(cssVarMap).forEach(([cssVar, colorKey]) => {
      root.style.setProperty(cssVar, palette.colors[colorKey])
    })
  }

  const handleSelect = (key: PaletteKey) => {
    setCurrentPalette(key)
    localStorage.setItem(STORAGE_KEY, key)
    applyPalette(key)
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="rounded-full">
        <Palette className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full"
          title={`Palette: ${palettes[currentPalette].name}`}
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Light Theme Palette</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(palettes).map(([key, palette]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleSelect(key as PaletteKey)}
            className="flex items-center gap-2"
          >
            <div 
              className="w-4 h-4 rounded-full border border-neutral-300"
              style={{ backgroundColor: palette.colors.primary }}
            />
            <div className="flex-1">
              <div className="text-sm">{palette.name}</div>
              <div className="text-xs text-muted-foreground">{palette.description}</div>
            </div>
            {currentPalette === key && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
