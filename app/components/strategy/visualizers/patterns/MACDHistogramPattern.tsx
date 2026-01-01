import { Line, Rect, Text } from '../svg'
import { COLORS, DIMENSIONS, LAYOUT, VIEWBOX } from '../constants'

interface MACDHistogramPatternProps {
  condition: 'crosses_above' | 'crosses_below' | 'positive' | 'negative' | 'rising' | 'falling'
}

export function MACDHistogramPattern({ condition }: MACDHistogramPatternProps) {
  const zeroLine = LAYOUT.centerY
  
  // Different bar patterns based on condition
  let bars: { x: number; height: number; positive: boolean }[] = []
  
  if (condition === 'crosses_above') {
    bars = [
      { x: 40, height: 40, positive: false },
      { x: 80, height: 30, positive: false },
      { x: 120, height: 20, positive: false },
      { x: 180, height: 20, positive: true },
      { x: 220, height: 30, positive: true },
      { x: 260, height: 40, positive: true },
    ]
  } else if (condition === 'crosses_below') {
    bars = [
      { x: 40, height: 40, positive: true },
      { x: 80, height: 30, positive: true },
      { x: 120, height: 20, positive: true },
      { x: 180, height: 20, positive: false },
      { x: 220, height: 30, positive: false },
      { x: 260, height: 40, positive: false },
    ]
  } else if (condition === 'positive') {
    bars = [
      { x: 80, height: 35, positive: true },
      { x: 120, height: 35, positive: true },
      { x: 160, height: 35, positive: true },
      { x: 200, height: 35, positive: true },
      { x: 240, height: 35, positive: true },
    ]
  } else if (condition === 'negative') {
    bars = [
      { x: 80, height: 35, positive: false },
      { x: 120, height: 35, positive: false },
      { x: 160, height: 35, positive: false },
      { x: 200, height: 35, positive: false },
      { x: 240, height: 35, positive: false },
    ]
  } else if (condition === 'rising') {
    bars = [
      { x: 60, height: 15, positive: true },
      { x: 100, height: 25, positive: true },
      { x: 140, height: 35, positive: true },
      { x: 180, height: 45, positive: true },
      { x: 220, height: 55, positive: true },
      { x: 260, height: 65, positive: true },
    ]
  } else { // falling
    bars = [
      { x: 70, height: 50, positive: true },
      { x: 110, height: 40, positive: true },
      { x: 150, height: 30, positive: true },
      { x: 190, height: 20, positive: true },
      { x: 230, height: 10, positive: true },
    ]
  }

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Zero line */}
      <Line
        x1={0}
        y1={zeroLine}
        x2={DIMENSIONS.width}
        y2={zeroLine}
        color={COLORS.grid}
        width={DIMENSIONS.lineReference}
        opacity={COLORS.gridOpacity}
        dash="5,5"
      />
      
      {/* Histogram bars */}
      {bars.map((bar, idx) => (
        <Rect
          key={idx}
          x={bar.x - 10}
          y={bar.positive ? zeroLine - bar.height : zeroLine}
          width={20}
          height={bar.height}
          fill={bar.positive ? COLORS.bullish : COLORS.bearish}
          opacity={0.8}
        />
      ))}
      
      {/* Bottom description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={LAYOUT.labelY}
        text={
          condition === 'crosses_above' ? 'Histogram Crosses Above' :
          condition === 'crosses_below' ? 'Histogram Crosses Below' :
          condition === 'positive' ? 'Histogram > 0' :
          condition === 'negative' ? 'Histogram < 0' :
          condition === 'rising' ? 'Histogram Rising' :
          'Histogram Contracting'
        }
        color={
          (condition === 'crosses_above' || condition === 'positive' || condition === 'rising') 
            ? COLORS.bullish 
            : condition === 'crosses_below' || condition === 'negative'
            ? COLORS.bearish
            : COLORS.neutral
        }
      />
    </svg>
  )
}
