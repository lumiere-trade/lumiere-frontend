"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save, Loader2 } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useChat } from "@/contexts/ChatContext"
import { FieldParam, IndicatorParam, regenerateTSDL } from "@/lib/api/prophet"
import {
  useCreateStrategy,
  useUpdateStrategy,
  useCreateConversation
} from "@/hooks/mutations/use-architect-mutations"
import { toast } from "sonner"
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
  const { strategyMetadata, messages, currentStrategy } = useChat()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()

  const [showCode, setShowCode] = useState(false)
  const [name, setName] = useState(strategy.name)
  const [paramValues, setParamValues] = useState<Record<string, any>>({})
  const [tsdlCode, setTsdlCode] = useState(strategy.tsdl_code)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Parse entry/exit conditions from TSDL code
  const strategyLogic = useMemo(() => {
    const entryMatch = tsdlCode.match(/ENTRY_CONDITIONS\s+(.*?)(?=\s+END)/s)
    const exitMatch = tsdlCode.match(/EXIT_CONDITIONS\s+(.*?)(?=\s+(?:TAKE_PROFIT|STOP_LOSS|END))/s)

    let entryCondition = ''
    let exitCondition = ''

    if (entryMatch) {
      entryCondition = entryMatch[1].trim()
        .replace(/\s+AND\s+/g, ' AND\n')
        .replace(/\s+OR\s+/g, ' OR\n')
    }

    if (exitMatch) {
      exitCondition = exitMatch[1].trim()
        .replace(/\s+AND\s+/g, ' AND\n')
        .replace(/\s+OR\s+/g, ' OR\n')
    }

    return { entryCondition, exitCondition }
  }, [tsdlCode])

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

  // Update tsdl_code when strategy prop changes
  useEffect(() => {
    setTsdlCode(strategy.tsdl_code)
  }, [strategy.tsdl_code])

  // Update name when strategy prop changes
  useEffect(() => {
    setName(strategy.name)
  }, [strategy.name])

  const handleParamChange = (key: string, value: any) => {
    setParamValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      const isEditing = !!currentStrategy?.id

      log.info(isEditing ? 'Updating strategy' : 'Creating new strategy', {
        strategyId: currentStrategy?.id,
        name,
        paramCount: Object.keys(paramValues).length,
        messageCount: messages.length
      })

      // Extract base plugins from metadata
      const basePlugins: string[] = []
      if (strategyMetadata?.indicators && strategyMetadata.indicators.length > 0) {
        basePlugins.push('indicator_based')
      }

      // Prepare parameters object
      const parameters = {
        indicators: strategyMetadata?.indicators || [],
        asset: strategyMetadata?.asset || {},
        exit_conditions: strategyMetadata?.exit_conditions || {},
        risk_management: strategyMetadata?.risk_management || {},
        position_sizing: strategyMetadata?.position_sizing || {},
        values: paramValues
      }

      let finalTsdlCode = tsdlCode

      // If editing and parameters changed, regenerate TSDL
      if (isEditing && Object.keys(paramValues).length > 0) {
        try {
          setIsRegenerating(true)

          log.info('Regenerating TSDL with updated parameters', {
            paramCount: Object.keys(paramValues).length
          })

          const regenerateResponse = await regenerateTSDL({
            current_tsdl: tsdlCode,
            updated_values: paramValues
          })

          finalTsdlCode = regenerateResponse.tsdl_code
          setTsdlCode(finalTsdlCode)

          log.info('TSDL regenerated successfully', {
            oldLength: tsdlCode.length,
            newLength: finalTsdlCode.length
          })

          toast.success('Strategy code updated successfully')
        } catch (error) {
          log.error('Failed to regenerate TSDL', { error })
          toast.error('Failed to update strategy code. Saving with original code.')
        } finally {
          setIsRegenerating(false)
        }
      }

      let strategyId: string

      if (isEditing) {
        // UPDATE existing strategy
        await updateStrategyMutation.mutateAsync({
          strategyId: currentStrategy.id,
          updates: {
            name: name || strategy.name,
            description: `AI-generated ${strategy.type} strategy`,
            tsdl_code: finalTsdlCode,
            base_plugins: basePlugins.length > 0 ? basePlugins : ['indicator_based'],
            parameters
          }
        })
        strategyId = currentStrategy.id

        log.info('Strategy updated successfully', {
          strategyId,
          name: name || strategy.name
        })
      } else {
        // CREATE new strategy
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: name || strategy.name,
          description: `AI-generated ${strategy.type} strategy`,
          tsdl_code: finalTsdlCode,
          version: '1.0.0',
          base_plugins: basePlugins.length > 0 ? basePlugins : ['indicator_based'],
          parameters
        })
        strategyId = strategyResponse.strategy_id

        log.info('Strategy created successfully', {
          strategyId,
          name: name || strategy.name
        })
      }

      // Save conversation history if messages exist
      if (messages.length > 0) {
        log.info('Saving conversation history', {
          strategyId,
          messageCount: messages.length
        })

        await createConversationMutation.mutateAsync({
          strategy_id: strategyId,
          state: 'completed',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            conversation_state: 'completed',
            timestamp: msg.timestamp.toISOString()
          }))
        })

        log.info('Conversation history saved successfully', {
          strategyId,
          messageCount: messages.length
        })
      } else {
        log.warn('No conversation history to save', {
          strategyId
        })
      }

      // Success is handled by mutations (toasts)
    } catch (error) {
      log.error('Failed to save strategy', { error })
      // Error is handled by mutations
    }
  }

  const handleBacktest = () => {
    log.info('Backtest started', { name })
    toast.info('Backtest feature coming soon!')
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
              <p className="text-sm text-muted-foreground">
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
              <label className="text-base font-semibold text-foreground">{label}</label>
              <span className="text-base font-mono text-primary">
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
              <p className="text-sm text-muted-foreground">
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

  const isEditing = !!currentStrategy?.id
  const isSaving = isRegenerating ||
                   createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending ||
                   createConversationMutation.isPending

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-40">
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
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRegenerating ? 'Regenerating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Strategy' : 'Save Strategy'}
              </>
            )}
          </Button>
        </div>
      </div>

      {isRegenerating && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Updating strategy code...</p>
              <p className="text-xs text-muted-foreground">AI is regenerating TSDL with your new parameters</p>
            </div>
          </div>
        </div>
      )}

      {showCode && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <pre className="text-base text-muted-foreground whitespace-pre-wrap break-words font-mono">
            <code>{tsdlCode}</code>
          </pre>
        </div>
      )}

      <div className="bg-card border border-primary/20 rounded-2xl p-6">
        <div className="space-y-1">
          <label className="text-base font-semibold text-foreground">Strategy Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-primary/20 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-sm text-muted-foreground">
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
          {/* Strategy Logic Section - Read-only display */}
          {(strategyLogic.entryCondition || strategyLogic.exitCondition) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Strategy Logic</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-base font-semibold text-muted-foreground mb-2">Entry Conditions</p>
                  <pre className="text-base font-mono text-foreground whitespace-pre-wrap break-words">
                    {strategyLogic.entryCondition || 'No entry conditions defined'}
                  </pre>
                </div>
                <div>
                  <p className="text-base font-semibold text-muted-foreground mb-2">Exit Conditions</p>
                  <pre className="text-base font-mono text-foreground whitespace-pre-wrap break-words">
                    {strategyLogic.exitCondition || 'No exit conditions defined'}
                  </pre>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  These conditions are part of the strategy logic and cannot be edited directly. Modify indicator parameters above to adjust the strategy behavior.
                </p>
              </div>
            </div>
          )}

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
