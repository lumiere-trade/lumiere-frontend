import { Candlestick, Text } from '../svg'
import { COLORS, DIMENSIONS, VIEWBOX } from '../constants'

interface CandleDirectionPatternProps {
  bullish: boolean  // true = Close > Open, false = Close < Open
}

export function CandleDirectionPattern({ bullish }: CandleDirectionPatternProps) {
  // Show progression of candles ending with the target pattern
  const candles = bullish ? [
    // Mixed candles leading to bullish close
    { x: 80, open: 60, high: 55, low: 68, close: 58, bullish: false },
    { x: 140, open: 58, high: 52, low: 65, close: 55, bullish: true },
    { x: 200, open: 55, high: 50, low: 62, close: 53, bullish: false },
    { x: 260, open: 53, high: 48, low: 60, close: 52, bullish: true },
    // TARGET: Strong bullish candle (Close > Open)
    { x: 320, open: 52, high: 35, low: 58, close: 38, bullish: true, highlight: true },
  ] : [
    // Mixed candles leading to bearish close
    { x: 80, open: 40, high: 33, low: 47, close: 42, bullish: true },
    { x: 140, open: 42, high: 35, low: 48, close: 45, bullish: false },
    { x: 200, open: 45, high: 38, low: 52, close: 47, bullish: true },
    { x: 260, open: 47, high: 40, low: 54, close: 48, bullish: false },
    // TARGET: Strong bearish candle (Close < Open)
    { x: 320, open: 48, high: 62, low: 82, close: 78, bullish: false, highlight: true },
  ]

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
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
          width={candle.highlight ? 18 : 14}  // Highlight target candle
        />
      ))}
      
      {/* Annotation arrow pointing to target candle */}
      <text
        x={320}
        y={bullish ? 25 : 92}
        fill={bullish ? COLORS.bullish : COLORS.bearish}
        fontSize={14}
        fontWeight={700}
        textAnchor="middle"
      >
        ↓
      </text>
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={110}
        text={bullish ? "Bullish Candle (Close > Open)" : "Bearish Candle (Close < Open)"}
        color={bullish ? COLORS.bullish : COLORS.bearish}
        fontSize={DIMENSIONS.fontSize}
      />
    </svg>
  )
}
