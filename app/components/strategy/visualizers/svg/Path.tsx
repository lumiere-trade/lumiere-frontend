import { SVGPathProps } from '../types'
import { DIMENSIONS } from '../constants'

export function Path({
  d,
  color,
  width = DIMENSIONS.lineThick,
  opacity = 1,
  fill = 'none',
}: SVGPathProps) {
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      fill={fill}
    />
  )
}
