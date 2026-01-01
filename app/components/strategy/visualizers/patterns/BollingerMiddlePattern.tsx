import { Path, Candlestick, Text } from '../svg'
import { COLORS, DIMENSIONS, VIEWBOX } from '../constants'

interface BollingerMiddlePatternProps {
  priceAbove: boolean
}

export function BollingerMiddlePattern({ priceAbove }: BollingerMiddlePatternProps) {
  // Band paths
  const upperBand = "M 0 20 Q 100 22 200 20 T 400 22"
  const middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
  const lowerBand = "M 0 100 Q 100 98 200 100 T 400 102"
  
  // Candles - realistic price action
  const candles = priceAbove ? [
    { x: 80, open: 45, high: 38, low: 52, close: 40, bullish: true },
    { x: 120, open: 40, high: 35, low: 45, close: 42, bullish: false },
    { x: 160, open: 42, high: 38, low: 48, close: 45, bullish: false },
    { x: 200, open: 45, high: 40, low: 50, close: 48, bullish: false },
    { x: 240, open: 48, high: 42, low: 52, close: 50, bullish: false },
    { x: 280, open: 50, high: 45, low: 55, close: 52, bullish: false },
    { x: 320, open: 52, high: 48, low: 58, close: 55, bullish: false },
  ] : [
    { x: 80, open: 75, high: 68, low: 82, close: 70, bullish: true },
    { x: 120, open: 70, high: 63, low: 75, close: 68, bullish: false },
    { x: 160, open: 68, high: 62, low: 72, close: 65, bullish: true },
    { x: 200, open: 65, high: 60, low: 70, close: 62, bullish: false },
    { x: 240, open: 62, high: 58, low: 68, close: 60, bullish: true },
    { x: 280, open: 60, high: 55, low: 65, close: 58, bullish: false },
    { x: 320, open: 58, high: 52, low: 63, close: 55, bullish: true },
  ]

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Filled area between bands */}
      <defs>
        <linearGradient id="bandFillMiddle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.slowLine} stopOpacity="0.03" />
          <stop offset="50%" stopColor={COLORS.slowLine} stopOpacity="0.06" />
          <stop offset="100%" stopColor={COLORS.slowLine} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      
      <path
        d={`${upperBand} L ${DIMENSIONS.width} 120 L 0 120 Z`}
        fill="url(#bandFillMiddle)"
      />
      
      {/* Upper band */}
      <Path
        d={upperBand}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThin}
        opacity={0.4}
      />
      
      {/* Middle band (SMA) - highlighted */}
      <Path
        d={middleBand}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThick}
        opacity={0.8}
      />
      
      {/* Lower band */}
      <Path
        d={lowerBand}
        color={COLORS.slowLine}
        width={DIMENSIONS.lineThin}
        opacity={0.4}
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
      
      {/* Labels */}
      <Text
        x={10}
        y={18}
        text="Upper"
        opacity={0.4}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={58}
        text="Middle (SMA)"
        opacity={0.7}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={98}
        text="Lower"
        opacity={0.4}
        fontSize={10}
        anchor="start"
      />
      
      {/* Description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={115}
        text={priceAbove ? 'Price Above Middle Band' : 'Price Below Middle Band'}
        color={priceAbove ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
