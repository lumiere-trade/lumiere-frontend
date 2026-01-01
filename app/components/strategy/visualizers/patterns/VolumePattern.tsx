import { Line, Path, Rect, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface VolumePatternProps {
  mode: 'divergence' | 'spike'
  shortPeriod?: number
  longPeriod?: number
  multiplier?: number
}

export function VolumePattern({ 
  mode, 
  shortPeriod = 20, 
  longPeriod = 50,
  multiplier = 1.15 
}: VolumePatternProps) {
  
  if (mode === 'divergence') {
    // Volume_SMA comparison - smooth trend lines
    const shortPath = "M 0 95 Q 100 90 200 60 T 400 30"
    const longPath = "M 0 60 Q 100 58 200 60 T 400 62"
    
    return (
      <svg viewBox={VIEWBOX} className="w-full h-36">
        {/* Reference line */}
        <Line
          x1={0}
          y1={LAYOUT.centerY}
          x2={DIMENSIONS.width}
          y2={LAYOUT.centerY}
          color={COLORS.grid}
          opacity={COLORS.gridOpacity}
          dash="5,5"
        />
        
        {/* Long MA (baseline) */}
        <Path
          d={longPath}
          color={COLORS.slowLine}
          opacity={0.7}
        />
        
        {/* Short MA (diverging upward) */}
        <Path
          d={shortPath}
          color={COLORS.fastLine}
        />
        
        {/* Labels */}
        <Text
          x={10}
          y={65}
          text={`Volume_SMA(${longPeriod})`}
          opacity={COLORS.textMutedOpacity}
          fontSize={DIMENSIONS.fontSizeSmall}
          anchor="start"
        />
        <Text
          x={10}
          y={108}
          text={`Volume_SMA(${shortPeriod})`}
          opacity={COLORS.textMutedOpacity}
          fontSize={DIMENSIONS.fontSizeSmall}
          anchor="start"
        />
        
        {/* Bottom description */}
        <Text
          x={DIMENSIONS.width / 2}
          y={LAYOUT.labelY}
          text={`Volume_SMA(${shortPeriod}) > Volume_SMA(${longPeriod})`}
          color={COLORS.bullish}
        />
      </svg>
    )
  }
  
  // mode === 'spike'
  // Volume spike detection - bar chart with spike
  const bars = [
    { x: 60, height: 23 },
    { x: 100, height: 25 },
    { x: 140, height: 28 },
    { x: 180, height: 32 },
    { x: 220, height: 45 },  // Spike
    { x: 260, height: 50 },  // Spike continuation
    { x: 300, height: 80 },  // Major spike
  ]
  
  const baselineY = 70
  
  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Baseline (SMA) */}
      <Line
        x1={0}
        y1={baselineY}
        x2={DIMENSIONS.width}
        y2={baselineY}
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Volume bars */}
      {bars.map((bar, idx) => {
        const isSpike = bar.height > 40
        return (
          <Rect
            key={idx}
            x={bar.x - 10}
            y={baselineY + 2}
            width={20}
            height={bar.height}
            fill={isSpike ? COLORS.volumeHigh : COLORS.volumeNormal}
            opacity={isSpike ? 1 : 0.8}
          />
        )
      })}
      
      {/* Labels */}
      <Text
        x={10}
        y={65}
        text={`Volume SMA(${shortPeriod})`}
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY + 2}
        text="High Volume"
        color={COLORS.bullish}
      />
    </svg>
  )
}
