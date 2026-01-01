import { SVGTextProps } from '../types'
import { DIMENSIONS } from '../constants'

export function Text({
  x,
  y,
  text,
  color = 'currentColor',
  opacity = 1,
  fontSize = DIMENSIONS.fontSize,
  fontWeight = DIMENSIONS.fontWeight,
  anchor = 'middle',
}: SVGTextProps) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      opacity={opacity}
      fontSize={fontSize}
      fontWeight={fontWeight}
      textAnchor={anchor}
    >
      {text}
    </text>
  )
}
