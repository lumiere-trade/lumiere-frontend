import { CandlestickProps } from '../types'
import { DIMENSIONS, COLORS } from '../constants'

export function Candlestick({
  x,
  open,
  high,
  low,
  close,
  bullish,
  width = DIMENSIONS.candleWidth,
}: CandlestickProps) {
  const bodyTop = Math.min(open, close)
  const bodyBottom = Math.max(open, close)
  const bodyHeight = Math.abs(close - open)
  const color = bullish ? COLORS.bullish : COLORS.bearish

  return (
    <g>
      {/* Upper wick */}
      <line
        x1={x}
        y1={high}
        x2={x}
        y2={bodyTop}
        stroke={color}
        strokeWidth={DIMENSIONS.candleWickWidth}
      />
      
      {/* Body */}
      <rect
        x={x - width / 2}
        y={bodyTop}
        width={width}
        height={bodyHeight || 1}
        fill={color}
        opacity={bullish ? 1 : 0.8}
      />
      
      {/* Lower wick */}
      <line
        x1={x}
        y1={bodyBottom}
        x2={x}
        y2={low}
        stroke={color}
        strokeWidth={DIMENSIONS.candleWickWidth}
      />
    </g>
  )
}
