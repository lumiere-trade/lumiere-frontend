import { SVGCircleProps } from '../types'
import { DIMENSIONS } from '../constants'

export function Circle({
  cx,
  cy,
  r,
  fill,
  stroke = 'white',
  strokeWidth = DIMENSIONS.pointStroke,
}: SVGCircleProps) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}
