import { Path, Text, Line } from '../svg'
import { COLORS, DIMENSIONS, VIEWBOX } from '../constants'

interface BollingerWidthPatternProps {
  condition: 'wide' | 'narrow' | 'expanding' | 'contracting'
  threshold?: number
}

export function BollingerWidthPattern({ condition, threshold }: BollingerWidthPatternProps) {
  
  // Different band patterns based on width condition
  let upperBand = ''
  let middleBand = ''
  let lowerBand = ''
  let description = ''
  
  if (condition === 'wide') {
    // Wide bands - high volatility
    upperBand = "M 0 10 Q 100 8 200 5 T 400 3"
    middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
    lowerBand = "M 0 110 Q 100 112 200 115 T 400 117"
    description = 'Wide Bands (High Volatility)'
  } else if (condition === 'narrow') {
    // Narrow bands - low volatility (squeeze)
    upperBand = "M 0 45 Q 100 44 200 43 T 400 42"
    middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
    lowerBand = "M 0 75 Q 100 74 200 77 T 400 78"
    description = 'Narrow Bands (Squeeze)'
  } else if (condition === 'expanding') {
    // Expanding - going from narrow to wide
    upperBand = "M 0 45 Q 100 35 200 20 T 400 5"
    middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
    lowerBand = "M 0 75 Q 100 85 200 100 T 400 115"
    description = 'Bands Expanding (Volatility Rising)'
  } else {
    // Contracting - going from wide to narrow
    upperBand = "M 0 10 Q 100 25 200 35 T 400 42"
    middleBand = "M 0 60 Q 100 58 200 60 T 400 62"
    lowerBand = "M 0 110 Q 100 95 200 85 T 400 78"
    description = 'Bands Contracting (Volatility Falling)'
  }

  return (
    <svg viewBox={VIEWBOX} className="w-full h-36">
      {/* Filled area between bands */}
      <defs>
        <linearGradient id={`bandFill-${condition}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.slowLine} stopOpacity="0.05" />
          <stop offset="50%" stopColor={COLORS.slowLine} stopOpacity="0.1" />
          <stop offset="100%" stopColor={COLORS.slowLine} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Background fill */}
      <path
        d={`${upperBand} L ${DIMENSIONS.width} 120 L 0 120 Z`}
        fill={`url(#bandFill-${condition})`}
      />
      
      {/* Upper band */}
      <Path
        d={upperBand}
        color={COLORS.bearish}
        width={DIMENSIONS.lineThin}
        opacity={0.6}
      />
      
      {/* Middle band (SMA) */}
      <Path
        d={middleBand}
        color={COLORS.slowLine}
        opacity={0.8}
      />
      
      {/* Lower band */}
      <Path
        d={lowerBand}
        color={COLORS.bullish}
        width={DIMENSIONS.lineThin}
        opacity={0.6}
      />
      
      {/* Width indicator arrows (left side) */}
      {condition === 'wide' && (
        <>
          <line x1={30} y1={5} x2={30} y2={115} stroke={COLORS.grid} strokeWidth={1} opacity={0.3} />
          <text x={35} y={60} fill={COLORS.grid} opacity={0.5} fontSize={10}>↕</text>
        </>
      )}
      
      {condition === 'narrow' && (
        <>
          <line x1={30} y1={43} x2={30} y2={77} stroke={COLORS.grid} strokeWidth={1} opacity={0.3} />
          <text x={35} y={60} fill={COLORS.grid} opacity={0.5} fontSize={10}>↕</text>
        </>
      )}
      
      {/* Labels */}
      <Text
        x={10}
        y={condition === 'wide' ? 8 : condition === 'narrow' ? 40 : 15}
        text="Upper"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={58}
        text="SMA"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
      <Text
        x={10}
        y={condition === 'wide' ? 115 : condition === 'narrow' ? 75 : 110}
        text="Lower"
        opacity={0.5}
        fontSize={10}
        anchor="start"
      />
      
      {/* Description */}
      <Text
        x={DIMENSIONS.width / 2}
        y={115}
        text={description}
        color={condition === 'expanding' || condition === 'wide' ? COLORS.bearish : COLORS.bullish}
      />
    </svg>
  )
}
