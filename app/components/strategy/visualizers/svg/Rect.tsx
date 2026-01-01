import { SVGRectProps } from '../types'

export function Rect({
  x,
  y,
  width,
  height,
  fill,
  opacity = 1,
  stroke,
  strokeWidth,
}: SVGRectProps) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}
