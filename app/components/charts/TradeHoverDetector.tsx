"use client"

import { useEffect, useCallback, memo } from "react"
import { Trade, Candle } from "./types"
import { useSharedViewport } from "./SharedViewportContext"
import { findCandleIndex, indexToX, priceToY } from "./chartUtils"

interface TradeHoverDetectorProps {
  panelTop: number
  panelHeight: number
  width: number
}

export const TradeHoverDetector = memo(function TradeHoverDetector({
  panelTop,
  panelHeight,
  width
}: TradeHoverDetectorProps) {
  const { state, candles, trades, setHoveredTrade } = useSharedViewport()

  const detectHoveredTrade = useCallback((mouseX: number, mouseY: number) => {
    if (!state.mouse || trades.length === 0 || candles.length === 0) {
      setHoveredTrade(null)
      return
    }

    // Check if mouse is in this panel vertically
    if (mouseY < panelTop || mouseY > panelTop + panelHeight) {
      setHoveredTrade(null)
      return
    }

    // Calculate padding (match pricePanelRenderer.ts)
    const padding = {
      top: 5,
      right: Math.max(58, width * 0.075),
      bottom: 5,
      left: Math.max(15, width * 0.02)
    }

    // Get viewport data
    const { candleWidth, startIdx, endIdx, offsetX } = state.sharedViewport

    // Calculate price range (match renderer logic)
    let priceMin = Infinity
    let priceMax = -Infinity

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < candles.length) {
        const candle = candles[i]
        priceMin = Math.min(priceMin, candle.l)
        priceMax = Math.max(priceMax, candle.h)
      }
    }

    const priceRange = priceMax - priceMin
    priceMin -= priceRange * 0.05
    priceMax += priceRange * 0.05

    const arrowSize = 8
    const hitBoxWidth = 18

    // Check each trade
    for (const trade of trades) {
      const tradeIdx = findCandleIndex(candles, trade.t)
      
      // Only check trades in viewport
      if (tradeIdx < startIdx || tradeIdx > endIdx) continue

      const x = indexToX(tradeIdx, candleWidth, offsetX, padding.left, startIdx)
      const yPrice = priceToY(trade.p, priceMin, priceMax, panelHeight, padding.top)

      // Arrow center position (below for BUY, above for SELL)
      const isBuy = trade.s === 'B'
      const yArrow = isBuy ? yPrice + 15 : yPrice - 15

      // Arrow occupies from (yArrow - arrowSize) to (yArrow + arrowSize)
      const arrowTop = yArrow - arrowSize
      const arrowBottom = yArrow + arrowSize

      // Convert mouse Y to canvas coordinates
      const canvasMouseY = mouseY - panelTop

      // Check if mouse is within rectangular hit box
      const withinX = Math.abs(mouseX - x) <= hitBoxWidth / 2
      const withinY = canvasMouseY >= arrowTop && canvasMouseY <= arrowBottom

      if (withinX && withinY) {
        setHoveredTrade(trade)
        return
      }
    }

    // No trade hovered
    setHoveredTrade(null)
  }, [state, candles, trades, setHoveredTrade, panelTop, panelHeight, width])

  // Track mouse movement
  useEffect(() => {
    if (state.mouse) {
      detectHoveredTrade(state.mouse.x, state.mouse.y)
    } else {
      setHoveredTrade(null)
    }
  }, [state.mouse, detectHoveredTrade, setHoveredTrade])

  return null
})
