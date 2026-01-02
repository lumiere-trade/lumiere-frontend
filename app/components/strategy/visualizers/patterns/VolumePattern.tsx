import { Line, Path, Rect, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX, getIndicatorColor } from '../constants'

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
    
    const shortColor = getIndicatorColor(shortPeriod)
    const longColor = getIndicatorColor(longPeriod)
    
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
          color={longColor}
          opacity={0.8}
        />
        
        {/* Short MA (diverging upward) */}
        <Path
          d={shortPath}
          color={shortColor}
        />
        
        {/* Labels */}
        <Text
          x={10}
          y={65}
          text={`Volume_SMA(${longPeriod})`}
          color={longColor}
          opacity={0.7}
          fontSize={DIMENSIONS.fontSize}
          anchor="start"
        />
        <Text
          x={10}
          y={108}
          text={`Volume_SMA(${shortPeriod})`}
          color={shortColor}
          opacity={0.7}
          fontSize={DIMENSIONS.fontSize}
          anchor="start"
        />
        
        {/* Bottom description */}
        <Text
          x={DIMENSIONS.width / 2}
          y={LAYOUT.labelY}
          text={`Volume_SMA(${shortPeriod}) > Volume_SMA(${longPeriod})`}
          color={COLORS.bullish}
          fontSize={DIMENSIONS.fontSize}
        />
      </svg>
    )
  }
  
  // mode === 'spike'
  // Volume spike - RISING bars centered on baseline
  const baselineColor = getIndicatorColor(shortPeriod)
  
  // ASCENDING volume bars - shows rising volume trend
  const bars = [
    { x: 60, height: 18 },   // Low
    { x: 100, height: 22 },  // Rising
    { x: 140, height: 28 },  // Rising
    { x: 180, height: 35 },  // Rising
    { x: 220, height: 45 },  // Spike above threshold
    { x: 260, height: 55 },  // Higher spike
    { x: 300, height: 70 },  // Highest - major spike
  ]
  
  const baselineY = 60  // Center position
  
  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Baseline (SMA) - centered */}
      <Line
        x1={0}
        y1={baselineY}
        x2={DIMENSIONS.width}
        y2={baselineY}
        color={baselineColor}
        opacity={0.8}
      />
      
      {/* Volume bars - ascending pattern, drawn ABOVE baseline */}
      {bars.map((bar, idx) => {
        // Bars above threshold (last 3) are green (high volume)
        const isSpike = bar.height > 40
        return (
          <Rect
            key={idx}
            x={bar.x - 10}
            y={baselineY - bar.height}  // DRAW UPWARD from baseline
            width={20}
            height={bar.height}
            fill={isSpike ? COLORS.volumeHigh : COLORS.volumeNormal}
            opacity={0.9}
          />
        )
      })}
      
      {/* Label - positioned BELOW baseline */}
      <Text
        x={10}
        y={72}
        text={`Volume SMA(${shortPeriod})`}
        color={baselineColor}
        opacity={0.7}
        fontSize={DIMENSIONS.fontSize}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY + 2}
        text="High Volume"
        color={COLORS.bullish}
        fontSize={DIMENSIONS.fontSize}
      />
    </svg>
  )
}
