"use client"

import { cn } from "@lumiere/shared/lib/utils"

interface ArcGaugeProps {
  value: number
  min?: number
  max?: number
  label: string
  unit?: string
  size?: "sm" | "md" | "lg"
  zones?: {
    low: number      // Below this = oversold/low zone
    high: number     // Above this = overbought/high zone
  }
  className?: string
}

/**
 * Arc Gauge for oscillator indicators (RSI, ADX, Stochastic)
 * Shows value on a semi-circular gauge with colored zones
 */
export function ArcGauge({
  value,
  min = 0,
  max = 100,
  label,
  unit = "",
  size = "md",
  zones = { low: 30, high: 70 },
  className,
}: ArcGaugeProps) {
  // Normalize value to 0-100 range for positioning
  const normalizedValue = Math.max(min, Math.min(max, value))
  const percentage = ((normalizedValue - min) / (max - min)) * 100
  
  // Calculate rotation angle (-90 to 90 degrees for semi-circle)
  const angle = -90 + (percentage * 1.8)
  
  // Determine zone color
  const getZoneColor = () => {
    if (normalizedValue <= zones.low) return "text-green-500"  // Oversold = buy opportunity
    if (normalizedValue >= zones.high) return "text-red-500"   // Overbought = sell signal
    return "text-primary"  // Neutral zone
  }
  
  // Size configurations
  const sizes = {
    sm: { width: 80, height: 48, strokeWidth: 6, fontSize: "text-sm", labelSize: "text-xs" },
    md: { width: 100, height: 60, strokeWidth: 8, fontSize: "text-base", labelSize: "text-xs" },
    lg: { width: 120, height: 72, strokeWidth: 10, fontSize: "text-lg", labelSize: "text-sm" },
  }
  
  const s = sizes[size]
  const radius = (s.width - s.strokeWidth) / 2
  const centerX = s.width / 2
  const centerY = s.height
  
  // Arc path for background
  const arcPath = `M ${s.strokeWidth / 2} ${s.height} A ${radius} ${radius} 0 0 1 ${s.width - s.strokeWidth / 2} ${s.height}`
  
  // Calculate zone arc segments
  const lowZoneEnd = (zones.low / max) * 180
  const highZoneStart = (zones.high / max) * 180
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg 
        width={s.width} 
        height={s.height + 4} 
        viewBox={`0 0 ${s.width} ${s.height + 4}`}
        className="overflow-visible"
      >
        {/* Background arc - muted */}
        <path
          d={arcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />
        
        {/* Low zone (green) */}
        <path
          d={arcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(lowZoneEnd / 180) * Math.PI * radius} ${Math.PI * radius}`}
          className="text-green-500/40"
        />
        
        {/* High zone (red) */}
        <path
          d={arcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${((180 - highZoneStart) / 180) * Math.PI * radius} ${Math.PI * radius}`}
          strokeDashoffset={`-${(highZoneStart / 180) * Math.PI * radius}`}
          className="text-red-500/40"
        />
        
        {/* Needle */}
        <g transform={`rotate(${angle} ${centerX} ${centerY})`}>
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - radius + s.strokeWidth}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className={getZoneColor()}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={3}
            fill="currentColor"
            className={getZoneColor()}
          />
        </g>
      </svg>
      
      {/* Value display */}
      <div className={cn("font-semibold -mt-1", s.fontSize, getZoneColor())}>
        {normalizedValue.toFixed(1)}{unit}
      </div>
      
      {/* Label */}
      <div className={cn("text-muted-foreground", s.labelSize)}>
        {label}
      </div>
    </div>
  )
}
