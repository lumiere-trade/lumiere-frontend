import { Line, Path, Circle, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface CrossoverPatternProps {
  type: 'golden' | 'death' | 'macd_bullish' | 'macd_bearish'
  fastLabel?: string
  slowLabel?: string
}

export function CrossoverPattern({ 
  type, 
  fastLabel = 'Fast',
  slowLabel = 'Slow' 
}: CrossoverPatternProps) {
  const isBullish = type === 'golden' || type === 'macd_bullish'
  const crossX = isBullish ? 120 : 167
  
  // Path definitions
  const fastPath = isBullish
    ? "M 0 90 Q 100 80 200 50 T 400 40"
    : "M 0 40 Q 100 50 200 80 T 400 90"
  
  const slowPath = `M 0 ${LAYOUT.centerY + 10} Q 100 ${LAYOUT.centerY + 8} 200 ${LAYOUT.centerY + 10} T 400 ${LAYOUT.centerY + 12}`

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
      
      {/* Slow line (always horizontal-ish) */}
      <Path
        d={slowPath}
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Fast line (curves to cross) */}
      <Path
        d={fastPath}
        color={COLORS.fastLine}
      />
      
      {/* Crossover point */}
      <Circle
        cx={crossX}
        cy={LAYOUT.centerY + 11}
        r={DIMENSIONS.pointRadius}
        fill={isBullish ? COLORS.bullish : COLORS.bearish}
      />
      
      {/* Labels */}
      {isBullish ? (
        <>
          <Text
            x={10}
            y={LAYOUT.centerY}
            text={slowLabel}
            opacity={COLORS.textMutedOpacity}
            anchor="start"
          />
          <Text
            x={10}
            y={LAYOUT.bottomY + 5}
            text={fastLabel}
            opacity={COLORS.textMutedOpacity}
            anchor="start"
          />
        </>
      ) : (
        <>
          <Text
            x={10}
            y={LAYOUT.labelStartY}
            text={fastLabel}
            opacity={COLORS.textMutedOpacity}
            anchor="start"
          />
          <Text
            x={10}
            y={85}
            text={slowLabel}
            opacity={COLORS.textMutedOpacity}
            anchor="start"
          />
        </>
      )}
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY}
        text={isBullish ? "Bullish Cross" : "Bearish Cross"}
        color={isBullish ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
