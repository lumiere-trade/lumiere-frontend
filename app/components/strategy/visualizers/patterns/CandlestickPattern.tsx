import { Line, Candlestick, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface CandlestickPatternProps {
  priceAboveMA: boolean
  maPeriod: number
  maType: 'EMA' | 'SMA'
}

export function CandlestickPattern({ 
  priceAboveMA, 
  maPeriod,
  maType 
}: CandlestickPatternProps) {
  const maY = LAYOUT.centerY
  
  // Candles - alternating bullish/bearish pattern
  const candles = priceAboveMA ? [
    { x: 80, open: 75, high: 68, low: 82, close: 70, bullish: false },
    { x: 120, open: 70, high: 63, low: 78, close: 68, bullish: true },
    { x: 160, open: 68, high: 66, low: 73, close: 72, bullish: false },
    { x: 200, open: 72, high: 65, low: 78, close: 68, bullish: true },
    { x: 240, open: 68, high: 67, low: 74, close: 72, bullish: false },
    { x: 280, open: 72, high: 62, low: 78, close: 68, bullish: true },
    { x: 320, open: 68, high: 64, low: 72, close: 71, bullish: false },
    { x: 360, open: 71, high: 50, low: 70, close: 20, bullish: true },  // Strong bullish
  ] : [
    { x: 80, open: 40, high: 33, low: 47, close: 38, bullish: false },
    { x: 120, open: 38, high: 28, low: 42, close: 35, bullish: true },
    { x: 160, open: 35, high: 30, low: 38, close: 37, bullish: false },
    { x: 200, open: 37, high: 32, low: 42, close: 38, bullish: true },
    { x: 240, open: 38, high: 30, low: 41, close: 37, bullish: false },
    { x: 280, open: 37, high: 30, low: 42, close: 38, bullish: true },
    { x: 320, open: 38, high: 34, low: 41, close: 39, bullish: false },
    { x: 360, open: 39, high: 50, low: 70, close: 20, bullish: false }, // Strong bearish
  ]

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Moving Average line */}
      <Line
        x1={0}
        y1={maY}
        x2={DIMENSIONS.width}
        y2={maY}
        color={COLORS.slowLine}
        opacity={0.7}
      />
      
      {/* Candlesticks */}
      {candles.map((candle, idx) => (
        <Candlestick
          key={idx}
          x={candle.x}
          open={candle.open}
          high={candle.high}
          low={candle.low}
          close={candle.close}
          bullish={candle.bullish}
        />
      ))}
      
      {/* MA Label */}
      <Text
        x={10}
        y={55}
        text={`${maType}(${maPeriod})`}
        opacity={COLORS.textMutedOpacity}
        fontSize={DIMENSIONS.fontSizeSmall}
        anchor="start"
      />
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY}
        text={priceAboveMA ? `Close > ${maType}(${maPeriod})` : `Close < ${maType}(${maPeriod})`}
        color={priceAboveMA ? COLORS.bullish : COLORS.bearish}
      />
    </svg>
  )
}
