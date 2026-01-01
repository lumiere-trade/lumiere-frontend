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
  const thresholdY = 110 - threshold
  
  // Oscillator path
  const oscillatorPath = type === 'rsi' || type === 'stochastic'
    ? (isAbove
        ? "M 0 60 Q 100 50 200 30 T 400 20"   // Rising above threshold
        : "M 0 60 Q 100 80 200 110 T 400 115") // Falling below threshold
    : (isAbove
        ? "M 0 95 Q 100 90 200 60 T 400 30"   // ADX rising (strong trend)
        : "M 0 30 Q 100 40 200 70 T 400 100") // ADX falling (weak trend)
  
  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Zone lines for RSI/Stochastic */}
      {(type === 'rsi' || type === 'stochastic') && (
        <>
          {/* Overbought (70/80) */}
          <Line
            x1={0}
            y1={40}
            x2={DIMENSIONS.width}
            y2={40}
            color={COLORS.bearish}
            width={DIMENSIONS.lineReference}
            opacity={0.5}
            dash="3,3"
          />
          
          {/* Oversold (30/20) */}
          <Line
            x1={0}
            y1={80}
            x2={DIMENSIONS.width}
            y2={80}
            color={COLORS.bullish}
            width={DIMENSIONS.lineReference}
            opacity={0.5}
            dash="3,3"
          />
          
          {/* Neutral (50) */}
          <Line
            x1={0}
            y1={LAYOUT.centerY}
            x2={DIMENSIONS.width}
            y2={LAYOUT.centerY}
            color={COLORS.grid}
            opacity={0.2}
          />
        </>
      )}
      
      {/* Threshold line */}
      <Line
        x1={0}
        y1={thresholdY}
        x2={DIMENSIONS.width}
        y2={thresholdY}
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Oscillator line */}
      <Path
        d={oscillatorPath}
        color={COLORS.fastLine}
      />
      
      {/* Zone labels */}
      {(type === 'rsi' || type === 'stochastic') && (
        <>
          <Text
            x={5}
            y={38}
            text={type === 'rsi' ? '70' : '80'}
            color={COLORS.bearish}
            fontSize={DIMENSIONS.fontSizeSmall}
            anchor="start"
          />
          <Text
            x={5}
            y={58}
            text="50"
            opacity={COLORS.textMutedOpacity}
            fontSize={DIMENSIONS.fontSizeSmall}
            anchor="start"
          />
          <Text
            x={5}
            y={78}
            text={type === 'rsi' ? '30' : '20'}
            color={COLORS.bullish}
            fontSize={DIMENSIONS.fontSizeSmall}
            anchor="start"
          />
        </>
      )}
      
      {/* Threshold label */}
      <Text
        x={5}
        y={thresholdY + 5}
        text={threshold.toString()}
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
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
