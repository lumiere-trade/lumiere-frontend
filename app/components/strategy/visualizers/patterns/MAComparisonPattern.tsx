import { Path, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

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
  
  // Two parallel-ish paths showing one consistently above the other
  const topPath = fastAbove
    ? "M 0 60 Q 100 50 200 20 T 400 10"
    : "M 0 60 Q 100 50 200 20 T 400 10"
  
  const bottomPath = fastAbove
    ? "M 0 95 Q 100 85 200 55 T 400 45"
    : "M 0 95 Q 100 85 200 55 T 400 45"

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
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Top MA */}
      <Path
        d={topPath}
        color={COLORS.fastLine}
      />
      
      {/* Labels */}
      <Text
        x={10}
        y={25}
        text={firstMA}
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      <Text
        x={10}
        y={108}
        text={secondMA}
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY + 8}
        text={`${firstMA} ${fastAbove ? '>' : '<'} ${secondMA}`}
        color={fastAbove ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
