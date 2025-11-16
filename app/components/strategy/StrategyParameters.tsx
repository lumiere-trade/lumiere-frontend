"use client"

import { useState, useEffect } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useCreateChat } from "@/contexts/CreateChatContext"
import { FieldParam, IndicatorParam } from "@/lib/api/prophet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StrategyParametersProps {
  strategy: {
    name: string
    type: string
    parameters: Record<string, any>
    tsdl_code: string
  }
}

export function StrategyParameters({ strategy }: StrategyParametersProps) {
  const log = useLogger('StrategyParameters', LogCategory.COMPONENT)
  const { strategyMetadata } = useCreateChat()

  const [showCode, setShowCode] = useState(false)
  const [name, setName] = useState(strategy.name)
  const [paramValues, setParamValues] = useState<Record<string, any>>({})

  // Initialize param values from metadata
  useEffect(() => {
    if (!strategyMetadata) return

    const initialValues: Record<string, any> = {}

    // Indicators
    strategyMetadata.indicators?.forEach((indicator) => {
      Object.entries(indicator.params).forEach(([paramName, paramData]) => {
        const key = `indicator_${indicator.name}_${paramName}`
        initialValues[key] = paramData.value
      })
    })

    // Asset fields
    Object.entries(strategyMetadata.asset || {}).forEach(([fieldName, fieldData]) => {
      initialValues[`asset_${fieldName}`] = fieldData.value
    })

    // Exit conditions
    Object.entries(strategyMetadata.exit_conditions || {}).forEach(([fieldName, fieldData]) => {
      initialValues[`exit_${fieldName}`] = fieldData.value
    })

    // Risk management
    Object.entries(strategyMetadata.risk_management || {}).forEach(([fieldName, fieldData]) => {
      initialValues[`risk_${fieldName}`] = fieldData.value
    })

    // Position sizing
    Object.entries(strategyMetadata.position_sizing || {}).forEach(([fieldName, fieldData]) => {
      initialValues[`position_${fieldName}`] = fieldData.value
    })

    setParamValues(initialValues)

    log.info('Initialized parameter values from metadata', {
      indicatorCount: strategyMetadata.indicators?.length || 0,
      paramCount: Object.keys(initialValues).length
    })
  }, [strategyMetadata])

  const handleParamChange = (key: string, value: any) => {
    setParamValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    log.info('Strategy saved', {
      name,
      paramValues
    })
    alert('Strategy saved! (Mock implementation)')
  }

  const handleBacktest = () => {
    log.info('Backtest started', { name })
    alert('Starting backtest... (Mock implementation)')
  }

  const renderParamField = (
    key: string,
    label: string,
    paramData: FieldParam,
    description?: string
  ) => {
    const currentValue = paramValues[key] ?? paramData.value

    // Enum type - render select dropdown
    if (paramData.type === 'enum' && paramData.values) {
      return (
        <div key={key} className="bg-card border border-primary/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">{label}</label>
              <span className="text-sm font-mono text-primary">{currentValue}</span>
            </div>
            <Select
              value={currentValue}
              onValueChange={(value) => handleParamChange(key, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paramData.values.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(description || paramData.description) && (
              <p className="text-xs text-muted-foreground">
                {description || paramData.description}
              </p>
            )}
          </div>
        </div>
      )
    }

    // Number types (int/float) - render slider
    if (paramData.type === 'int' || paramData.type === 'float') {
      const min = paramData.min ?? 0
      const max = paramData.max ?? 100
      const step = paramData.step ?? (paramData.type === 'int' ? 1 : 0.1)
      const unit = paramData.unit || ''

      return (
        <div key={key} className="bg-card border border-primary/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">{label}</label>
              <span className="text-sm font-mono text-primary">
                {currentValue}{unit}
              </span>
            </div>
            <Slider
              value={[Number(currentValue)]}
              onValueChange={(value) => handleParamChange(key, value[0])}
              min={min}
              max={max}
              step={step}
              className="w-full"
            />
            {(description || paramData.description) && (
              <p className="text-xs text-muted-foreground">
                {description || paramData.description}
              </p>
            )}
          </div>
        </div>
      )
    }

    // Fallback for other types
    return null
  }

  const renderIndicatorParams = (indicator: IndicatorParam) => {
    return (
      <div key={indicator.name} className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          {indicator.display_name || indicator.type} ({indicator.name})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(indicator.params).map(([paramName, paramData]) => {
            const key = `indicator_${indicator.name}_${paramName}`
            const label = paramName.charAt(0).toUpperCase() + paramName.slice(1).replace(/_/g, ' ')
            return renderParamField(key, label, paramData)
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-32">
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
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <pre className="text-base text-muted-foreground whitespace-pre-wrap break-words">
            <code>{strategy.tsdl_code}</code>
          </pre>
        </div>
      )}

      <div className="bg-card border border-primary/20 rounded-2xl p-6">
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
      </div>

      {!strategyMetadata && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground text-center">
            No parameter metadata available. Parameters will appear after Prophet generates a strategy.
          </p>
        </div>
      )}

      {strategyMetadata && (
        <>
          {/* Indicators Section */}
          {strategyMetadata.indicators && strategyMetadata.indicators.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">Indicators</h3>
              {strategyMetadata.indicators.map(renderIndicatorParams)}
            </div>
          )}

          {/* Asset Section */}
          {strategyMetadata.asset && Object.keys(strategyMetadata.asset).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Asset Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(strategyMetadata.asset).map(([fieldName, fieldData]) => {
                  const key = `asset_${fieldName}`
                  const label = fieldName.replace(/_/g, ' ')
                  return renderParamField(key, label, fieldData)
                })}
              </div>
            </div>
          )}

          {/* Exit Conditions Section */}
          {strategyMetadata.exit_conditions && Object.keys(strategyMetadata.exit_conditions).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Exit Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(strategyMetadata.exit_conditions).map(([fieldName, fieldData]) => {
                  const key = `exit_${fieldName}`
                  const label = fieldName.replace(/_/g, ' ')
                  return renderParamField(key, label, fieldData)
                })}
              </div>
            </div>
          )}

          {/* Risk Management Section */}
          {strategyMetadata.risk_management && Object.keys(strategyMetadata.risk_management).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Risk Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(strategyMetadata.risk_management).map(([fieldName, fieldData]) => {
                  const key = `risk_${fieldName}`
                  const label = fieldName.replace(/_/g, ' ')
                  return renderParamField(key, label, fieldData)
                })}
              </div>
            </div>
          )}

          {/* Position Sizing Section */}
          {strategyMetadata.position_sizing && Object.keys(strategyMetadata.position_sizing).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Position Sizing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(strategyMetadata.position_sizing).map(([fieldName, fieldData]) => {
                  const key = `position_${fieldName}`
                  const label = fieldName.replace(/_/g, ' ')
                  return renderParamField(key, label, fieldData)
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
