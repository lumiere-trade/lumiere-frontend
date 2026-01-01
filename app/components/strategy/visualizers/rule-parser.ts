import { ParsedRule, RuleType } from './types'

/**
 * Parse rule text into structured format
 * Simple regex-based parsing for educational visualization
 */
export function parseRule(rule: string): ParsedRule {
  const ruleLower = rule.toLowerCase()
  
  // MACD Histogram patterns
  if (ruleLower.includes('macd_histogram')) {
    if (ruleLower.includes('crosses_above') && (ruleLower.includes('0') || ruleLower.includes('zero'))) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'crosses_above' } }
    }
    if (ruleLower.includes('crosses_below') && (ruleLower.includes('0') || ruleLower.includes('zero'))) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'crosses_below' } }
    }
    if (ruleLower.includes('>') && (ruleLower.includes('0') || ruleLower.includes('zero'))) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'positive' } }
    }
    if (ruleLower.includes('<') && (ruleLower.includes('0') || ruleLower.includes('zero'))) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'negative' } }
    }
    if (ruleLower.includes('rising') || ruleLower.includes('expanding')) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'rising' } }
    }
    if (ruleLower.includes('falling') || ruleLower.includes('contracting')) {
      return { type: 'macd_histogram', rawText: rule, params: { condition: 'falling' } }
    }
  }
  
  // MACD Crossover (without histogram)
  if (ruleLower.includes('macd') && ruleLower.includes('crosses') && !ruleLower.includes('histogram')) {
    const crossesAbove = ruleLower.includes('crosses_above')
    return { 
      type: 'macd_crossover', 
      rawText: rule, 
      params: { direction: crossesAbove ? 'above' : 'below' } 
    }
  }
  
  // MACD vs Signal comparison (no crossover)
  if (ruleLower.includes('macd') && ruleLower.includes('signal') && !ruleLower.includes('crosses') && !ruleLower.includes('histogram')) {
    const macdAbove = ruleLower.includes('>') || ruleLower.includes('above')
    return {
      type: 'macd_comparison',
      rawText: rule,
      params: { operator: macdAbove ? 'gt' : 'lt' }
    }
  }
  
  // Moving Average Crossover
  if ((ruleLower.includes('ema') || ruleLower.includes('sma')) && ruleLower.includes('crosses') && !ruleLower.includes('close') && !ruleLower.includes('price')) {
    const crossesAbove = ruleLower.includes('crosses_above')
    const maMatches = rule.match(/(EMA|SMA)\((\d+)\)/gi) || []
    
    if (maMatches.length >= 2) {
      const fast = maMatches[0].match(/\d+/)![0]
      const slow = maMatches[1].match(/\d+/)![0]
      const type = maMatches[0].toUpperCase().startsWith('EMA') ? 'EMA' : 'SMA'
      
      return {
        type: 'ma_crossover',
        rawText: rule,
        params: {
          fastPeriod: parseInt(fast),
          slowPeriod: parseInt(slow),
          type,
          direction: crossesAbove ? 'above' : 'below'
        }
      }
    }
  }
  
  // Moving Average Comparison (no crossover) - includes Volume_SMA
  if ((ruleLower.includes('ema') || ruleLower.includes('sma') || ruleLower.includes('volume_sma')) && 
      (ruleLower.includes('>') || ruleLower.includes('<')) && 
      !ruleLower.includes('crosses') && 
      !ruleLower.includes('close') && 
      !ruleLower.includes('price') &&
      !ruleLower.includes('bollinger')) {
    
    const maMatches = rule.match(/(EMA|SMA|Volume_SMA)\((\d+)\)/gi) || []
    
    // Skip single Volume_SMA (handled by volume_spike)
    const volumeSmaMatches = rule.match(/Volume_SMA\((\d+)\)/gi) || []
    if (volumeSmaMatches.length === 1) {
      return { type: 'unknown', rawText: rule, params: {} }
    }
    
    if (maMatches.length >= 2) {
      const fastAbove = ruleLower.includes('>')
      return {
        type: 'ma_comparison',
        rawText: rule,
        params: {
          firstMA: maMatches[0],
          secondMA: maMatches[1],
          operator: fastAbove ? 'gt' : 'lt'
        }
      }
    }
  }
  
  // Price vs MA
  if ((ruleLower.includes('close') || ruleLower.includes('price')) && 
      (ruleLower.includes('ema') || ruleLower.includes('sma')) &&
      !ruleLower.includes('bollinger')) {
    
    const maMatch = rule.match(/(EMA|SMA)\((\d+)\)/i)
    if (maMatch) {
      const period = parseInt(maMatch[2])
      const type = maMatch[1].toUpperCase() as 'EMA' | 'SMA'
      
      let operator: 'gt' | 'lt' | 'crosses_above' | 'crosses_below'
      if (ruleLower.includes('crosses_above')) {
        operator = 'crosses_above'
      } else if (ruleLower.includes('crosses_below')) {
        operator = 'crosses_below'
      } else if (ruleLower.includes('>')) {
        operator = 'gt'
      } else {
        operator = 'lt'
      }
      
      return {
        type: 'price_vs_ma',
        rawText: rule,
        params: { maPeriod: period, maType: type, operator }
      }
    }
  }
  
  // Bollinger Width - BOLLINGER_WIDTH comparisons
  if (ruleLower.includes('bollinger_width')) {
    const thresholdMatch = rule.match(/([\d.]+)/)
    const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : 0.035
    
    let condition: 'wide' | 'narrow' | 'expanding' | 'contracting'
    
    if (ruleLower.includes('rising') || ruleLower.includes('expanding')) {
      condition = 'expanding'
    } else if (ruleLower.includes('falling') || ruleLower.includes('contracting')) {
      condition = 'contracting'
    } else if (ruleLower.includes('>')) {
      condition = 'wide'
    } else {
      condition = 'narrow'
    }
    
    return {
      type: 'bollinger_width',
      rawText: rule,
      params: { condition, threshold }
    }
  }
  
  // Bollinger Middle - Price vs BOLLINGER_MIDDLE
  if (ruleLower.includes('bollinger_middle')) {
    const priceAbove = ruleLower.includes('>') || ruleLower.includes('above')
    return {
      type: 'bollinger_middle',
      rawText: rule,
      params: { priceAbove }
    }
  }
  
  // Bollinger Bands - Touch upper/lower
  if (ruleLower.includes('bollinger') && !ruleLower.includes('width') && !ruleLower.includes('middle')) {
    const touchesLower = ruleLower.includes('lower') || ruleLower.includes('<')
    return {
      type: 'bollinger_bands',
      rawText: rule,
      params: {
        band: touchesLower ? 'lower' : 'upper',
        action: 'touches'
      }
    }
  }
  
  // RSI Threshold
  if (ruleLower.includes('rsi') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
    const rsiMatch = rule.match(/RSI\((\d+)\)/i)
    const thresholdMatch = rule.match(/[><]\s*(\d+)/)
    
    if (rsiMatch && thresholdMatch) {
      const period = parseInt(rsiMatch[1])
      const threshold = parseInt(thresholdMatch[1])
      const operator = ruleLower.includes('>') ? 'gt' : 'lt'
      
      return {
        type: 'rsi_threshold',
        rawText: rule,
        params: { period, threshold, operator }
      }
    }
  }
  
  // Volume Divergence (two Volume_SMA comparison)
  if (ruleLower.includes('volume_sma')) {
    const volumeSmaMatches = rule.match(/Volume_SMA\((\d+)\)/gi) || []
    
    if (volumeSmaMatches.length >= 2) {
      const periods = volumeSmaMatches.map(m => parseInt(m.match(/\d+/)![0]))
      const multiplierMatch = rule.match(/\*\s*([\d.]+)/)
      const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 1.15
      
      return {
        type: 'volume_divergence',
        rawText: rule,
        params: {
          shortPeriod: Math.min(...periods),
          longPeriod: Math.max(...periods),
          multiplier
        }
      }
    }
  }
  
  // Volume Spike (single Volume comparison)
  if (ruleLower.includes('volume') && (ruleLower.includes('>') || ruleLower.includes('sma'))) {
    const volumeSmaMatches = rule.match(/Volume_SMA\((\d+)\)/gi) || []
    
    // Only single Volume_SMA
    if (volumeSmaMatches.length < 2) {
      const periodMatch = rule.match(/Volume_SMA\((\d+)\)/i) || rule.match(/SMA\((\d+)\)/i)
      const multiplierMatch = rule.match(/\*\s*([\d.]+)/)
      
      const period = periodMatch ? parseInt(periodMatch[1]) : 20
      const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 1.2
      
      return {
        type: 'volume_spike',
        rawText: rule,
        params: { period, multiplier }
      }
    }
  }
  
  // Stochastic
  if (ruleLower.includes('stochastic')) {
    const thresholdMatch = rule.match(/[><]\s*(\d+)/)
    const threshold = thresholdMatch ? parseInt(thresholdMatch[1]) : 50
    const operator = ruleLower.includes('>') ? 'gt' : 'lt'
    const zone = threshold > 60 ? 'overbought' : threshold < 40 ? 'oversold' : 'overbought'
    
    return {
      type: 'stochastic',
      rawText: rule,
      params: { threshold, operator, zone }
    }
  }
  
  // ADX
  if (ruleLower.includes('adx')) {
    const strongTrend = ruleLower.includes('>') && (ruleLower.includes('25') || ruleLower.includes('20'))
    return {
      type: 'adx',
      rawText: rule,
      params: {
        threshold: strongTrend ? 25 : 20,
        condition: strongTrend ? 'strong_trend' : 'weak_trend'
      }
    }
  }
  
  // ATR - FIXED: detect rising/falling keywords
  if (ruleLower.includes('atr')) {
    // Check for rising/falling keywords first
    if (ruleLower.includes('rising') || ruleLower.includes('expanding') || ruleLower.includes('increasing')) {
      return {
        type: 'atr',
        rawText: rule,
        params: { condition: 'high_volatility' }
      }
    }
    if (ruleLower.includes('falling') || ruleLower.includes('contracting') || ruleLower.includes('decreasing')) {
      return {
        type: 'atr',
        rawText: rule,
        params: { condition: 'low_volatility' }
      }
    }
    
    // Fallback to > < operators
    const highVolatility = ruleLower.includes('>')
    return {
      type: 'atr',
      rawText: rule,
      params: {
        condition: highVolatility ? 'high_volatility' : 'low_volatility'
      }
    }
  }
  
  // Trend
  if (ruleLower.includes('rising') || ruleLower.includes('falling')) {
    const direction = ruleLower.includes('rising') ? 'rising' : 'falling'
    return {
      type: 'trend',
      rawText: rule,
      params: { direction }
    }
  }
  
  // Unknown pattern
  return { type: 'unknown', rawText: rule, params: {} }
}
