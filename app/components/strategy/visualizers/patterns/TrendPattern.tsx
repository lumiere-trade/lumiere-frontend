import { Path, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface TrendPatternProps {
  direction: 'rising' | 'falling'
  indicator?: string
}

export function TrendPattern({ direction, indicator }: TrendPatternProps) {
  const isRising = direction === 'rising'
  
  // Trend path
  const trendPath = isRising
    ? "M 0 90 Q 100 80 200 50 T 400 20"
    : "M 0 20 Q 100 40 200 70 T 400 100"

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Reference line */}
      <Path
        d={`M 0 ${LAYOUT.centerY} L ${DIMENSIONS.width} ${LAYOUT.centerY}`}
        color={COLORS.grid}
        width={DIMENSIONS.lineReference}
        opacity={COLORS.gridOpacity}
        dash="5,5"
      />
      
      {/* Trend line */}
      <Path
        d={trendPath}
        color={isRising ? COLORS.bullish : COLORS.bearish}
        width={3}
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY}
        text={`${isRising ? 'Rising' : 'Falling'} Trend${indicator ? ` (${indicator})` : ''}`}
        color={isRising ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
