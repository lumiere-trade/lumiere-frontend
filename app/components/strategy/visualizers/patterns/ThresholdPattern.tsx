import { Line, Path, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface ThresholdPatternProps {
  type: 'rsi' | 'stochastic' | 'adx'
  threshold: number
  operator: 'gt' | 'lt'
  period?: number
}

export function ThresholdPattern({ 
  type, 
  threshold, 
  operator,
  period = 14 
}: ThresholdPatternProps) {
  const isAbove = operator === 'gt'
  
  // Calculate Y position for threshold (inverted scale: 0=top, 100=bottom)
  // Map: RSI 100 -> Y 10, RSI 0 -> Y 110
  const mapValue = (value: number) => 110 - value
  
  const thresholdY = mapValue(threshold)
  
  // Oscillator path - stays within bounds
  const oscillatorPath = type === 'rsi' || type === 'stochastic'
    ? (isAbove
        ? `M 0 ${mapValue(40)} Q 100 ${mapValue(50)} 200 ${mapValue(65)} T 400 ${mapValue(70)}`
        : `M 0 ${mapValue(80)} Q 100 ${mapValue(70)} 200 ${mapValue(55)} T 400 ${mapValue(50)}`)
    : (isAbove
        ? "M 0 95 Q 100 90 200 60 T 400 30"
        : "M 0 30 Q 100 40 200 70 T 400 100")
  
  // Determine which zone lines to show based on threshold
  const showOverbought = threshold <= 60  // Show 70 line if threshold is below it
  const showOversold = threshold >= 40    // Show 30 line if threshold is above it
  const showNeutral = (type === 'rsi' || type === 'stochastic') && threshold !== 50

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Zone lines - only show relevant ones */}
      {(type === 'rsi' || type === 'stochastic') && (
        <>
          {/* Overbought (70) - prominent */}
          {showOverbought && (
            <>
              <Line
                x1={0}
                y1={mapValue(70)}
                x2={DIMENSIONS.width}
                y2={mapValue(70)}
                color={COLORS.bearish}
                width={1.5}
                opacity={0.6}
                dash="5,3"
              />
              <Text
                x={DIMENSIONS.width - 5}
                y={mapValue(70) - 3}
                text="70"
                color={COLORS.bearish}
                fontSize={DIMENSIONS.fontSizeSmall}
                opacity={0.7}
                anchor="end"
              />
            </>
          )}
          
          {/* Oversold (30) - prominent */}
          {showOversold && (
            <>
              <Line
                x1={0}
                y1={mapValue(30)}
                x2={DIMENSIONS.width}
                y2={mapValue(30)}
                color={COLORS.bullish}
                width={1.5}
                opacity={0.6}
                dash="5,3"
              />
              <Text
                x={DIMENSIONS.width - 5}
                y={mapValue(30) - 3}
                text="30"
                color={COLORS.bullish}
                fontSize={DIMENSIONS.fontSizeSmall}
                opacity={0.7}
                anchor="end"
              />
            </>
          )}
          
          {/* Neutral (50) - subtle but visible */}
          {showNeutral && (
            <>
              <Line
                x1={0}
                y1={mapValue(50)}
                x2={DIMENSIONS.width}
                y2={mapValue(50)}
                color={COLORS.grid}
                width={1.5}
                opacity={0.4}
                dash="5,3"
              />
              <Text
                x={DIMENSIONS.width - 5}
                y={mapValue(50) - 3}
                text="50"
                opacity={0.5}
                fontSize={DIMENSIONS.fontSizeSmall}
                anchor="end"
              />
            </>
          )}
        </>
      )}
      
      {/* Threshold line - highlighted */}
      <Line
        x1={0}
        y1={thresholdY}
        x2={DIMENSIONS.width}
        y2={thresholdY}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThick}
        opacity={0.8}
      />
      
      {/* Oscillator line */}
      <Path
        d={oscillatorPath}
        color={COLORS.fastLine}
        width={DIMENSIONS.lineThick}
      />
      
      {/* Threshold value label - positioned to avoid overlap */}
      <Text
        x={5}
        y={thresholdY - 5}
        text={threshold.toString()}
        color={COLORS.slowLine}
        fontSize={DIMENSIONS.fontSize}
        fontWeight={700}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY + 3}
        text={`${type.toUpperCase()}(${period}) ${isAbove ? '>' : '<'} ${threshold}`}
        color={isAbove ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
