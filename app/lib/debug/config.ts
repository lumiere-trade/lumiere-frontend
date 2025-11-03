/**
 * Debug Configuration
 * SSR-safe: only runs in browser
 */

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

export enum LogCategory {
  AUTH = 'AUTH',
  WALLET = 'WALLET',
  API = 'API',
  ESCROW = 'ESCROW',
  QUERY = 'QUERY',
  MUTATION = 'MUTATION',
  COMPONENT = 'COMPONENT',
  NETWORK = 'NETWORK',
  STATE = 'STATE',
  PERFORMANCE = 'PERF',
}

interface DebugConfig {
  enabled: boolean
  level: LogLevel
  categories: Set<LogCategory>
  showTimestamp: boolean
  showStackTrace: boolean
  persistToStorage: boolean
  maxStoredLogs: number
}

const isBrowser = typeof window !== 'undefined'

class DebugConfiguration {
  private config: DebugConfig

  constructor() {
    const isDev = process.env.NODE_ENV === 'development'
    const savedConfig = isBrowser ? this.loadFromStorage() : null

    this.config = {
      enabled: savedConfig?.enabled ?? isDev,
      level: savedConfig?.level ?? (isDev ? LogLevel.DEBUG : LogLevel.WARN),
      categories: new Set(savedConfig?.categories ?? Object.values(LogCategory)),
      showTimestamp: savedConfig?.showTimestamp ?? true,
      showStackTrace: savedConfig?.showStackTrace ?? false,
      persistToStorage: savedConfig?.persistToStorage ?? false,
      maxStoredLogs: savedConfig?.maxStoredLogs ?? 1000,
    }

    if (isBrowser) {
      (window as any).__LUMIERE_DEBUG__ = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        setLevel: (level: LogLevel) => this.setLevel(level),
        enableCategory: (cat: LogCategory) => this.enableCategory(cat),
        disableCategory: (cat: LogCategory) => this.disableCategory(cat),
        getConfig: () => ({ ...this.config, categories: Array.from(this.config.categories) }),
      }
    }
  }

  private loadFromStorage(): Partial<DebugConfig> | null {
    if (!isBrowser) return null
    try {
      const stored = localStorage.getItem('lumiere_debug_config')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        categories: parsed.categories ? new Set(parsed.categories) : undefined,
      }
    } catch {
      return null
    }
  }

  private saveToStorage(): void {
    if (!isBrowser) return
    try {
      localStorage.setItem(
        'lumiere_debug_config',
        JSON.stringify({
          ...this.config,
          categories: Array.from(this.config.categories),
        })
      )
    } catch (e) {
      console.error('Failed to save debug config:', e)
    }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getLevel(): LogLevel {
    return this.config.level
  }

  isCategoryEnabled(category: LogCategory): boolean {
    return this.config.categories.has(category)
  }

  shouldShowTimestamp(): boolean {
    return this.config.showTimestamp
  }

  shouldShowStackTrace(): boolean {
    return this.config.showStackTrace
  }

  shouldPersist(): boolean {
    return this.config.persistToStorage
  }

  getMaxStoredLogs(): number {
    return this.config.maxStoredLogs
  }

  enable(): void {
    this.config.enabled = true
    this.saveToStorage()
  }

  disable(): void {
    this.config.enabled = false
    this.saveToStorage()
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
    this.saveToStorage()
  }

  enableCategory(category: LogCategory): void {
    this.config.categories.add(category)
    this.saveToStorage()
  }

  disableCategory(category: LogCategory): void {
    this.config.categories.delete(category)
    this.saveToStorage()
  }
}

export const debugConfig = new DebugConfiguration()
