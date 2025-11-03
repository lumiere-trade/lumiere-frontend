# Lumiere Debug System

Production-grade centralized logging system for React applications.

## Features

- **Category-based filtering** - Filter logs by feature area (AUTH, WALLET, API, etc.)
- **Log levels** - ERROR, WARN, INFO, DEBUG, TRACE
- **Colored output** - Each category has a unique color in console
- **Timestamps** - Optional millisecond-precision timestamps
- **Stack traces** - Optional stack traces for errors
- **Runtime control** - Enable/disable from browser console
- **Persistent storage** - Optional log persistence to localStorage
- **React integration** - Custom hooks for component logging

## Quick Start

### Basic Usage
```typescript
import { logger, LogCategory } from '@/lib/debug'

// Simple logging
logger.info(LogCategory.AUTH, 'User logged in')
logger.error(LogCategory.API, 'Request failed', { error })

// With data
logger.debug(LogCategory.WALLET, 'Balance updated', { 
  old: '100',
  new: '150' 
})

// Performance tracking
logger.time(LogCategory.PERFORMANCE, 'fetchData')
await fetchData()
logger.timeEnd(LogCategory.PERFORMANCE, 'fetchData')

// Grouped logs
logger.group(LogCategory.AUTH, 'Login Flow')
logger.debug(LogCategory.AUTH, 'Step 1: Connect wallet')
logger.debug(LogCategory.AUTH, 'Step 2: Sign message')
logger.debug(LogCategory.AUTH, 'Step 3: Verify signature')
logger.groupEnd()
```

### React Component Usage
```typescript
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'

function MyComponent() {
  const log = useLogger('MyComponent', LogCategory.COMPONENT)

  useEffect(() => {
    log.info('Component initialized')
  }, [])

  const handleClick = () => {
    log.debug('Button clicked', { timestamp: Date.now() })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

## Categories

| Category | Color | Use Case |
|----------|-------|----------|
| `AUTH` | Purple | Authentication flows |
| `WALLET` | Sky Blue | Wallet operations |
| `API` | Cyan | API calls |
| `ESCROW` | Emerald | Escrow operations |
| `QUERY` | Amber | React Query operations |
| `MUTATION` | Red | React Mutations |
| `COMPONENT` | Violet | Component lifecycle |
| `NETWORK` | Blue | Network requests |
| `STATE` | Pink | State changes |
| `PERFORMANCE` | Teal | Performance metrics |

## Log Levels
```typescript
enum LogLevel {
  NONE = 0,      // No logs
  ERROR = 1,     // Only errors
  WARN = 2,      // Errors + warnings
  INFO = 3,      // Errors + warnings + info
  DEBUG = 4,     // Everything except trace
  TRACE = 5,     // Everything including trace
}
```

## Runtime Control

Open browser console and use:
```javascript
// Enable/disable logging
__LUMIERE_DEBUG__.enable()
__LUMIERE_DEBUG__.disable()

// Set log level
__LUMIERE_DEBUG__.setLevel(4) // DEBUG level

// Filter by category
__LUMIERE_DEBUG__.disableCategory('COMPONENT')
__LUMIERE_DEBUG__.enableCategory('AUTH')

// View current config
__LUMIERE_DEBUG__.getConfig()

// Export logs
__LUMIERE_LOGGER__.exportLogs()

// Clear logs
__LUMIERE_LOGGER__.clearLogs()
```

## Environment Configuration

Debug system automatically configures based on environment:

**Development:**
- Enabled by default
- Log level: DEBUG
- All categories enabled
- Timestamps shown

**Production:**
- Disabled by default
- Log level: WARN
- Can be enabled via console

## Migration Guide

### Old way (scattered console.log):
```typescript
console.log('[Auth] User logged in')
console.log('[Auth] Token:', token)
```

### New way (centralized logger):
```typescript
import { logger, LogCategory } from '@/lib/debug'

logger.info(LogCategory.AUTH, 'User logged in')
logger.debug(LogCategory.AUTH, 'Token received', { token })
```

## Best Practices

1. **Use appropriate levels:**
   - `error()` - Actual errors that need attention
   - `warn()` - Potential issues
   - `info()` - Important state changes
   - `debug()` - Development debugging
   - `trace()` - Verbose details

2. **Choose correct categories:**
   - Group related functionality
   - Makes filtering easier

3. **Include context in data:**
```typescript
   logger.debug(LogCategory.API, 'Request failed', {
     endpoint: '/api/users',
     status: 404,
     error: error.message
   })
```

4. **Use groups for complex flows:**
```typescript
   logger.group(LogCategory.AUTH, 'Complete Login Flow')
   // Multiple related logs
   logger.groupEnd()
```

5. **Performance monitoring:**
```typescript
   logger.time(LogCategory.PERFORMANCE, 'expensiveOperation')
   await expensiveOperation()
   logger.timeEnd(LogCategory.PERFORMANCE, 'expensiveOperation')
```

## Advanced: Custom Categories

Add new categories in `lib/debug/config.ts`:
```typescript
export enum LogCategory {
  // ... existing
  TRADING = 'TRADING',
  BACKTEST = 'BACKTEST',
}
```

Don't forget to add colors in `logger.ts`:
```typescript
const colors: Record<LogCategory, string> = {
  // ... existing
  [LogCategory.TRADING]: '#22c55e',
  [LogCategory.BACKTEST]: '#f97316',
}
```
