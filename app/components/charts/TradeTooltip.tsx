"use client"

import { memo } from "react"
import { Trade } from "./types"
import { format } from "date-fns"
import { Lightbulb, OctagonX, Target, ArrowUp, ArrowDown } from "lucide-react"

interface TradeTooltipProps {
  trade: Trade
  x: number
  y: number
  canvasWidth: number
  canvasHeight: number
}

export const TradeTooltip = memo(function TradeTooltip({
  trade,
  x,
  y,
  canvasWidth,
  canvasHeight
}: TradeTooltipProps) {
  
  // Offset tooltip away from arrow
  const TOOLTIP_OFFSET = 30
  
  // Position tooltip above or below based on space
  const showAbove = y > canvasHeight / 2
  const showLeft = x > canvasWidth / 2
  
  // Parse multi-condition reasons
  const conditions = trade.reason ? trade.reason.split(' AND ') : []
  const hasMultipleConditions = conditions.length > 1
  
  // Get trade type icon/label
  const getTradeType = () => {
    if (!trade.reason) {
      return { 
        icon: <Lightbulb className="h-5 w-5" />, 
        label: 'Signal', 
        color: 'bg-gray-500' 
      }
    }
    
    const lower = trade.reason.toLowerCase()
    if (lower.includes('stop loss')) {
      return { 
        icon: <OctagonX className="h-5 w-5" />, 
        label: 'Stop Loss', 
        color: 'bg-red-500' 
      }
    }
    if (lower.includes('take profit')) {
      return { 
        icon: <Target className="h-5 w-5" />, 
        label: 'Take Profit', 
        color: 'bg-green-500' 
      }
    }
    if (lower.includes('crosses above')) {
      return { 
        icon: <ArrowUp className="h-5 w-5" />, 
        label: 'Entry Signal', 
        color: 'bg-blue-500' 
      }
    }
    if (lower.includes('crosses below')) {
      return { 
        icon: <ArrowDown className="h-5 w-5" />, 
        label: 'Exit Signal', 
        color: 'bg-orange-500' 
      }
    }
    
    return trade.s === 'B' 
      ? { 
          icon: <ArrowUp className="h-5 w-5" />, 
          label: 'Entry', 
          color: 'bg-blue-500' 
        }
      : { 
          icon: <ArrowDown className="h-5 w-5" />, 
          label: 'Exit', 
          color: 'bg-gray-500' 
        }
  }
  
  const tradeType = getTradeType()
  
  return (
    <div 
      className="absolute z-50 pointer-events-none"
      style={{
        left: showLeft ? x - 320 - TOOLTIP_OFFSET : x + TOOLTIP_OFFSET,
        top: showAbove ? y - 240 - TOOLTIP_OFFSET : y + TOOLTIP_OFFSET,
      }}
    >
      <div className="bg-background border-2 border-primary/20 rounded-lg shadow-xl p-4 w-80 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <div className="text-foreground">{tradeType.icon}</div>
          <div className="flex-1">
            <div className={`inline-block px-2.5 py-1 rounded text-white text-sm font-semibold ${tradeType.color}`}>
              {tradeType.label}
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {format(new Date(trade.t), 'MMM dd, HH:mm')}
          </div>
        </div>
        
        {/* Reason */}
        <div className="mb-3">
          <div className="text-sm font-semibold text-muted-foreground mb-1.5">Reason:</div>
          {hasMultipleConditions ? (
            <ul className="space-y-1.5">
              {conditions.map((condition, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5 font-semibold">✓</span>
                  <span className="text-foreground font-medium">{condition.trim()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground font-medium">{trade.reason || 'Signal'}</p>
          )}
        </div>
        
        {/* Position & Value Info */}
        {trade.q !== undefined && trade.val !== undefined && (
          <div className="mb-3 pb-3 border-b border-border">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground font-medium mb-0.5">Position</div>
                <div className="font-mono font-semibold text-sm">{trade.q.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium mb-0.5">
                  {trade.s === 'B' ? 'Invested' : 'Exit Value'}
                </div>
                <div className="font-mono font-semibold text-sm">${trade.val.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Price & PnL Info */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <div className="text-muted-foreground font-medium mb-0.5">Price</div>
            <div className="font-mono font-semibold text-sm">${trade.p.toFixed(2)}</div>
          </div>
          {trade.pnl !== undefined && trade.pnl !== null && (
            <div>
              <div className="text-muted-foreground font-medium mb-0.5">P&L</div>
              <div className={`font-mono font-semibold text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                {trade.pnl_pct !== undefined && (
                  <span className="text-sm ml-1">
                    ({trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Top Indicators */}
        {trade.indicators && Object.keys(trade.indicators).length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Key Indicators:</div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(trade.indicators).slice(0, 4).map(([name, value]) => (
                <div key={name} className="text-sm">
                  <div className="text-muted-foreground truncate font-medium mb-0.5">
                    {name.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="font-mono font-semibold text-sm">{value.toFixed(2)}</div>
                </div>
              ))}
            </div>
            {Object.keys(trade.indicators).length > 4 && (
              <div className="text-sm text-muted-foreground mt-2 font-medium">
                +{Object.keys(trade.indicators).length - 4} more
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Arrow pointer */}
      <div 
        className="absolute w-3 h-3 bg-background border-primary/20 transform rotate-45"
        style={{
          left: showLeft ? 'calc(100% - 12px)' : '-6px',
          top: showAbove ? 'calc(100% - 12px)' : '20px',
          borderWidth: showLeft ? '0 2px 2px 0' : '2px 0 0 2px'
        }}
      />
    </div>
  )
})
