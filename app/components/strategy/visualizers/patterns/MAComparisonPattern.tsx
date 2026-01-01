import { Path, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX, getIndicatorColor } from '../constants'

interface MAComparisonPatternProps {
  firstMA: string
  secondMA: string
  fastAbove: boolean
}

export function MAComparisonPattern({ 
  firstMA, 
  secondMA, 
  fastAbove 
}: MAComparisonPatternProps) {
  
  // Extract periods from MA strings (e.g., "SMA(10)" -> 10)
  const firstPeriod = parseInt(firstMA.match(/\d+/)?.[0] || '10')
  const secondPeriod = parseInt(secondMA.match(/\d+/)?.[0] || '20')
  
  // Get consistent colors based on periods
  const firstColor = getIndicatorColor(firstPeriod)
  const secondColor = getIndicatorColor(secondPeriod)
  
  // Two parallel-ish paths showing one consistently above the other
  const topPath = "M 0 35 Q 100 33 200 30 T 400 28"
  const bottomPath = "M 0 85 Q 100 83 200 80 T 400 78"

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
      
      {/* Bottom MA */}
      <Path
        d={bottomPath}
        color={secondColor}
        opacity={0.9}
      />
      
      {/* Top MA */}
      <Path
        d={topPath}
        color={firstColor}
      />
      
      {/* Labels */}
      <Text
        x={10}
        y={33}
        text={firstMA}
        color={firstColor}
        opacity={0.7}
        fontSize={DIMENSIONS.fontSize}
        anchor="start"
      />
      <Text
        x={10}
        y={83}
        text={secondMA}
        color={secondColor}
        opacity={0.7}
        fontSize={DIMENSIONS.fontSize}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY + 8}
        text={`${firstMA} ${fastAbove ? '>' : '<'} ${secondMA}`}
        color={fastAbove ? COLORS.bullish : COLORS.bearish}
        fontSize={DIMENSIONS.fontSize}
      />
    </svg>
  )
}
