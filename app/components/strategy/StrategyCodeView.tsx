"use client"

import { useState } from "react"
import { useChat } from "@/contexts/ChatContext"
import { compileStrategy } from "@/lib/api/architect"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

type CodeTab = 'json' | 'python'

export function StrategyCodeView() {
  const log = useLogger('StrategyCodeView', LogCategory.COMPONENT)
  const { generatedStrategy, strategyMetadata } = useChat()
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('json')
  const [pythonCode, setPythonCode] = useState<string | null>(generatedStrategy?.python_code || null)
  const [pythonClassName, setPythonClassName] = useState<string | null>(generatedStrategy?.strategy_class_name || null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  // Get TSDL JSON (always available)
  const tsdlJson = generatedStrategy?.tsdl_code 
    ? generatedStrategy.tsdl_code 
    : strategyMetadata 
      ? JSON.stringify(strategyMetadata, null, 2)
      : null

  const handleCompile = async () => {
    if (!strategyMetadata) {
      log.warn('No strategy metadata to compile')
      return
    }

    setIsCompiling(true)
    setCompileError(null)

    try {
      log.info('Compiling strategy on-demand', { name: strategyMetadata.name })
      const result = await compileStrategy(strategyMetadata)

      if (result.compiles) {
        setPythonCode(result.python_code || null)
        setPythonClassName(result.strategy_class_name || null)
        log.info('Compilation successful', { className: result.strategy_class_name })
      } else {
        setCompileError(result.compile_error || 'Compilation failed')
        log.warn('Compilation failed', { error: result.compile_error })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setCompileError(errorMsg)
      log.error('Compilation request failed', { error: errorMsg })
    } finally {
      setIsCompiling(false)
    }
  }

  // Auto-compile when switching to Python tab if code not available
  const handlePythonTabClick = () => {
    setActiveCodeTab('python')
    if (!pythonCode && !isCompiling && strategyMetadata) {
      handleCompile()
    }
  }

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
          onClick={handlePythonTabClick}
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
              Strategy Definition
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

          {isCompiling && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
              <p className="text-sm text-muted-foreground">Compiling strategy...</p>
            </div>
          )}

          {!isCompiling && compileError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <p className="text-sm font-semibold text-destructive mb-2">
                Compilation Error
              </p>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {compileError}
              </pre>
              <button
                onClick={handleCompile}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Retry Compilation
              </button>
            </div>
          )}

          {!isCompiling && !compileError && pythonCode && (
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto bg-muted/50 p-4 rounded-lg">
              {pythonCode}
            </pre>
          )}

          {!isCompiling && !compileError && !pythonCode && (
            <div className="text-center py-12">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                  Python code not yet compiled
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click compile to generate Python code for this strategy
                </p>
                <button
                  onClick={handleCompile}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Compile Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
