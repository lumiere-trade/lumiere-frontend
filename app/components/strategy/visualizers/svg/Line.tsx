import { SVGLineProps } from '../types'
import { DIMENSIONS } from '../constants'

export function Line({
  x1,
  y1,
  x2,
  y2,
  color,
  width = DIMENSIONS.lineThick,
  opacity = 1,
  dash,
}: SVGLineProps) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeDasharray={dash}
    />
  )
}
