import { Path, Circle, Candlestick, Text } from '../svg'
import { COLORS, DIMENSIONS, VIEWBOX } from '../constants'

interface BandPatternProps {
  touchPoint: 'upper' | 'lower'
}

export function BandPattern({ touchPoint }: BandPatternProps) {
  const touchesLower = touchPoint === 'lower'
  
  // Band paths
  const upperBand = "M 0 20 Q 100 22 200 20 T 400 22"
  const middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
  const lowerBand = "M 0 100 Q 100 98 200 100 T 400 102"
  
  // Realistic candles showing bounce from band
  const candles = touchesLower ? [
    { x: 80, open: 75, high: 68, low: 85, close: 72, bullish: false },
    { x: 120, open: 72, high: 65, low: 88, close: 75, bullish: false },
    { x: 160, open: 75, high: 70, low: 92, close: 82, bullish: false },
    { x: 200, open: 82, high: 78, low: 100, close: 98, bullish: false },  // Touch
    { x: 240, open: 98, high: 75, low: 100, close: 78, bullish: true },  // Bounce
    { x: 280, open: 78, high: 65, low: 82, close: 68, bullish: true },
    { x: 320, open: 68, high: 58, low: 72, close: 60, bullish: true },
  ] : [
    { x: 80, open: 45, high: 38, low: 55, close: 42, bullish: true },
    { x: 120, open: 42, high: 32, low: 48, close: 38, bullish: true },
    { x: 160, open: 38, high: 28, low: 42, close: 32, bullish: true },
    { x: 200, open: 32, high: 20, low: 38, close: 22, bullish: true },  // Touch
    { x: 240, open: 22, high: 25, low: 35, close: 32, bullish: false },  // Rejection
    { x: 280, open: 32, high: 35, low: 45, close: 42, bullish: false },
    { x: 320, open: 42, high: 45, low: 52, close: 48, bullish: false },
  ]

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Filled area between bands */}
      <defs>
        <linearGradient id="bandFillTouch" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.slowLine} stopOpacity="0.03" />
          <stop offset="50%" stopColor={COLORS.slowLine} stopOpacity="0.06" />
          <stop offset="100%" stopColor={COLORS.slowLine} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      
      <path
        d={`${upperBand} L ${DIMENSIONS.width} 120 L 0 120 Z`}
        fill="url(#bandFillTouch)"
      />
      
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
      
      {/* Candles */}
      {candles.map((candle, idx) => (
        <Candlestick
          key={idx}
          x={candle.x}
          open={candle.open}
          high={candle.high}
          low={candle.low}
          close={candle.close}
          bullish={candle.bullish}
          width={12}
        />
      ))}
      
      {/* Touch point marker */}
      <Circle
        cx={200}
        cy={touchesLower ? 100 : 20}
        r={6}
        fill={touchesLower ? COLORS.bullish : COLORS.bearish}
      />
      
      {/* Labels */}
      <Text
        x={10}
        y={18}
        text="Upper"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={58}
        text="SMA"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={98}
        text="Lower"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
    </svg>
  )
}
