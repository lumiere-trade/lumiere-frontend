"use client"

import { useState } from "react"
import { useChat } from "@/contexts/ChatContext"

type CodeTab = 'json' | 'python'

export function StrategyCodeView() {
  const { generatedStrategy, strategyMetadata } = useChat()
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('json')

  // Get TSDL JSON (always available)
  const tsdlJson = generatedStrategy?.tsdl_code 
    ? generatedStrategy.tsdl_code 
    : strategyMetadata 
      ? JSON.stringify(strategyMetadata, null, 2)
      : null

  // Get Python code (only when compiled)
  const pythonCode = generatedStrategy?.python_code || null
  const pythonClassName = generatedStrategy?.strategy_class_name || null

  return (
    <div className="space-y-4">
      {/* Code Type Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveCodeTab('json')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeCodeTab === 'json'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          TSDL JSON
        </button>
        <button
          onClick={() => setActiveCodeTab('python')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeCodeTab === 'python'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Python Code
        </button>
      </div>

      {/* TSDL JSON View */}
      {activeCodeTab === 'json' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Strategy Definition (TSDL v2.0)
            </h3>
            <p className="text-sm text-muted-foreground">
              This is the declarative strategy configuration that will be compiled and executed
            </p>
          </div>
          {tsdlJson ? (
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto bg-muted/50 p-4 rounded-lg">
              {tsdlJson}
            </pre>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No strategy loaded
            </div>
          )}
        </div>
      )}

      {/* Python Code View */}
      {activeCodeTab === 'python' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Compiled Python Code
            </h3>
            {pythonClassName && (
              <p className="text-sm text-muted-foreground">
                Class: <span className="font-mono font-semibold">{pythonClassName}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              This is the actual code that will execute your strategy on-chain
            </p>
          </div>
          {pythonCode ? (
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto bg-muted/50 p-4 rounded-lg">
              {pythonCode}
            </pre>
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                  Python code not yet compiled
                </p>
                <p className="text-sm text-muted-foreground">
                  Python code will be generated when you save the strategy or run a backtest
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
