"use client"

import { useState } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

interface StrategyParametersProps {
  strategy: {
    name: string
    type: string
    parameters: {
      rsi_buy_threshold: number
      rsi_sell_threshold: number
      take_profit_percent: number
      stop_loss_percent: number
      position_size_percent: number
    }
    tsdl_code: string
  }
}

export function StrategyParameters({ strategy }: StrategyParametersProps) {
  const log = useLogger('StrategyParameters', LogCategory.COMPONENT)
  const [showCode, setShowCode] = useState(false)
  const [name, setName] = useState(strategy.name)
  const [rsiBuy, setRsiBuy] = useState(strategy.parameters.rsi_buy_threshold)
  const [rsiSell, setRsiSell] = useState(strategy.parameters.rsi_sell_threshold)
  const [takeProfit, setTakeProfit] = useState(strategy.parameters.take_profit_percent)
  const [stopLoss, setStopLoss] = useState(strategy.parameters.stop_loss_percent)
  const [positionSize, setPositionSize] = useState(strategy.parameters.position_size_percent)

  const handleSave = () => {
    log.info('Strategy saved', { 
      name, 
      rsiBuy, 
      rsiSell, 
      takeProfit, 
      stopLoss, 
      positionSize 
    })
    alert('Strategy saved! (Mock implementation)')
  }

  const handleBacktest = () => {
    log.info('Backtest started', { name })
    alert('Starting backtest... (Mock implementation)')
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6 bg-card border border-primary/20 rounded-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Strategy Parameters</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            {showCode ? "Hide Code" : "View Code"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBacktest}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Backtest
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Strategy
          </Button>
        </div>
      </div>

      {showCode && (
        <div className="bg-background border border-primary/20 rounded-xl p-4">
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            <code>{strategy.tsdl_code}</code>
          </pre>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Strategy Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-primary/20 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Give your strategy a descriptive name
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">RSI Buy Threshold</label>
              <span className="text-sm font-mono text-primary">{rsiBuy}</span>
            </div>
            <Slider
              value={[rsiBuy]}
              onValueChange={(value) => setRsiBuy(value[0])}
              min={10}
              max={50}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Buy when RSI &lt; {rsiBuy} (oversold condition)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">RSI Sell Threshold</label>
              <span className="text-sm font-mono text-primary">{rsiSell}</span>
            </div>
            <Slider
              value={[rsiSell]}
              onValueChange={(value) => setRsiSell(value[0])}
              min={50}
              max={90}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Sell when RSI &gt; {rsiSell} (overbought condition)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Take Profit</label>
              <span className="text-sm font-mono text-primary">{takeProfit}%</span>
            </div>
            <Slider
              value={[takeProfit]}
              onValueChange={(value) => setTakeProfit(value[0])}
              min={1}
              max={20}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Close position at {takeProfit}% profit
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Stop Loss</label>
              <span className="text-sm font-mono text-primary">{stopLoss}%</span>
            </div>
            <Slider
              value={[stopLoss]}
              onValueChange={(value) => setStopLoss(value[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum loss per trade: {stopLoss}%
            </p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Position Size</label>
              <span className="text-sm font-mono text-primary">{positionSize}%</span>
            </div>
            <Slider
              value={[positionSize]}
              onValueChange={(value) => setPositionSize(value[0])}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Allocate {positionSize}% of available capital per trade
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
