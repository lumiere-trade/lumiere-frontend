/**
 * Centralized Logger
 * SSR-safe: no-op on server, full functionality in browser
 */

import { debugConfig, LogLevel, LogCategory } from './config'

interface LogEntry {
  timestamp: number
  level: LogLevel
  category: LogCategory
  message: string
  data?: any
  stack?: string
}

// Browser detection
const isBrowser = typeof window !== 'undefined'

class Logger {
  private logs: LogEntry[] = []

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!isBrowser) return false
    
    return (
      debugConfig.isEnabled() &&
      level <= debugConfig.getLevel() &&
      debugConfig.isCategoryEnabled(category)
    )
  }

  private formatMessage(
    level: LogLevel,
    category: LogCategory,
    message: string
  ): string {
    const parts: string[] = []

    if (debugConfig.shouldShowTimestamp()) {
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      })
      parts.push(`[${time}]`)
    }

    parts.push(`[${category}]`)
    parts.push(message)

    return parts.join(' ')
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    if (!isBrowser) return () => {}
    
    switch (level) {
      case LogLevel.ERROR:
        return console.error
      case LogLevel.WARN:
        return console.warn
      case LogLevel.INFO:
        return console.info
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        return console.log
      default:
        return console.log
    }
  }

  private getCategoryColor(category: LogCategory): string {
    const colors: Record<LogCategory, string> = {
      [LogCategory.AUTH]: '#9333ea',
      [LogCategory.WALLET]: '#0ea5e9',
      [LogCategory.API]: '#06b6d4',
      [LogCategory.ESCROW]: '#10b981',
      [LogCategory.QUERY]: '#f59e0b',
      [LogCategory.MUTATION]: '#ef4444',
      [LogCategory.COMPONENT]: '#8b5cf6',
      [LogCategory.NETWORK]: '#3b82f6',
      [LogCategory.STATE]: '#ec4899',
      [LogCategory.PERFORMANCE]: '#14b8a6',
    }
    return colors[category] || '#6b7280'
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any
  ): void {
    if (!this.shouldLog(level, category)) return

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    }

    if (debugConfig.shouldShowStackTrace() && level === LogLevel.ERROR) {
      entry.stack = new Error().stack
    }

    if (debugConfig.shouldPersist()) {
      this.logs.push(entry)
      if (this.logs.length > debugConfig.getMaxStoredLogs()) {
        this.logs.shift()
      }
    }

    const formatted = this.formatMessage(level, category, message)
    const consoleMethod = this.getConsoleMethod(level)
    const color = this.getCategoryColor(category)

    if (data !== undefined) {
      consoleMethod(
        `%c${formatted}`,
        `color: ${color}; font-weight: bold`,
        data
      )
    } else {
      consoleMethod(
        `%c${formatted}`,
        `color: ${color}; font-weight: bold`
      )
    }

    if (entry.stack && debugConfig.shouldShowStackTrace()) {
      console.log(entry.stack)
    }
  }

  error(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data)
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data)
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data)
  }

  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data)
  }

  trace(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.TRACE, category, message, data)
  }

  group(category: LogCategory, title: string): void {
    if (!this.shouldLog(LogLevel.DEBUG, category) || !isBrowser) return
    const color = this.getCategoryColor(category)
    console.group(`%c${title}`, `color: ${color}; font-weight: bold`)
  }

  groupEnd(): void {
    if (!isBrowser) return
    console.groupEnd()
  }

  table(category: LogCategory, data: any): void {
    if (!this.shouldLog(LogLevel.DEBUG, category) || !isBrowser) return
    console.table(data)
  }

  time(category: LogCategory, label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG, category) || !isBrowser) return
    console.time(`[${category}] ${label}`)
  }

  timeEnd(category: LogCategory, label: string): void {
    if (!this.shouldLog(LogLevel.DEBUG, category) || !isBrowser) return
    console.timeEnd(`[${category}] ${label}`)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()

// Expose to window for debugging (browser only)
if (isBrowser) {
  (window as any).__LUMIERE_LOGGER__ = {
    getLogs: () => logger.getLogs(),
    clearLogs: () => logger.clearLogs(),
    exportLogs: () => logger.exportLogs(),
  }
}
