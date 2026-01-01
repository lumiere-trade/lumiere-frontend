import { Path, Circle, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface BandPatternProps {
  touchPoint: 'upper' | 'lower'
}

export function BandPattern({ touchPoint }: BandPatternProps) {
  const touchesLower = touchPoint === 'lower'
  
  // Simple band paths
  const upperBand = "M 0 20 Q 100 22 200 20 T 400 22"
  const middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
  const lowerBand = "M 0 100 Q 100 98 200 100 T 400 102"
  
  // Simple price path - bounces off band
  const pricePath = touchesLower
    ? "M 0 60 Q 100 80 200 100 L 250 98 L 300 70 T 400 60"
    : "M 0 60 Q 100 40 200 20 L 250 22 L 300 50 T 400 60"

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Upper band */}
      <Path
        d={upperBand}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThin}
        opacity={0.5}
      />
      
      {/* Middle band (SMA) */}
      <Path
        d={middleBand}
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Lower band */}
      <Path
        d={lowerBand}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThin}
        opacity={0.5}
      />
      
      {/* Price line - shows bounce */}
      <Path
        d={pricePath}
        color={touchesLower ? COLORS.bullish : COLORS.bearish}
      />
      
      {/* Touch point marker */}
      <Circle
        cx={200}
        cy={touchesLower ? 100 : 20}
        r={DIMENSIONS.pointRadius}
        fill={touchesLower ? COLORS.bullish : COLORS.bearish}
      />
      
      {/* Labels */}
      <Text
        x={10}
        y={18}
        text="Upper"
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      <Text
        x={10}
        y={58}
        text="SMA"
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      <Text
        x={10}
        y={98}
        text="Lower"
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
    </svg>
  )
}
