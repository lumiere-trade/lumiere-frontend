# Lumiere Frontend

AI-powered algorithmic trading platform on Solana - Frontend application.

## Architecture

### Smart React Organization

Function-based architecture with direct API calls, React Query for data management, and minimal abstractions.

**Core Principles:**
- Function-based API layer
- React Query for queries and mutations
- Separate UI and API types with transformers
- Centralized debug system with runtime control

## Project Structure
```
app/
├── components/          # React components
│   ├── shared/         # Reusable UI components
│   │   └── ErrorBoundary/
│   └── wallet/         # Wallet-specific components
│       ├── WalletConnectionModal.tsx
│       ├── WalletPanel.tsx
│       └── DepositFundsModal.tsx
├── hooks/              # React hooks
│   ├── queries/        # Data fetching hooks
│   │   ├── use-auth-queries.ts
│   │   ├── use-escrow-queries.ts
│   │   └── use-legal-queries.ts
│   ├── mutations/      # Mutation hooks
│   │   ├── use-auth-mutations.ts
│   │   └── use-escrow-mutations.ts
│   ├── use-auth.ts     # Unified auth hook
│   ├── use-escrow.ts   # Unified escrow hook
│   └── use-logger.ts   # Component logging hook
├── lib/                # Core libraries
│   ├── api/            # API client layer
│   │   ├── client.ts   # Base HTTP client with error handling
│   │   ├── auth.ts     # Authentication endpoints
│   │   ├── escrow.ts   # Escrow endpoints
│   │   ├── storage.ts  # Token persistence
│   │   ├── types.ts    # API response types
│   │   └── index.ts    # API exports
│   ├── debug/          # Debug system
│   │   ├── logger.ts   # Centralized logger with categories
│   │   ├── config.ts   # Runtime configuration
│   │   ├── index.ts    # Debug exports
│   │   ├── README.md   # Debug documentation
│   │   └── EXAMPLES.md # Usage examples
│   └── infrastructure/
│       └── cache/      # React Query configuration
│           ├── query-client.config.ts
│           └── auth-cache-manager.ts
├── types/              # TypeScript types
│   ├── api.types.ts    # Backend API types (snake_case)
│   └── ui.types.ts     # Frontend UI types (camelCase) + transformers
├── providers/          # React context providers
│   ├── QueryProvider.tsx    # React Query setup
│   └── WalletProvider.tsx   # Solana wallet adapter
├── config/             # Configuration
│   └── constants.ts    # Application constants
└── app/                # Next.js app directory
    ├── layout.tsx
    ├── page.tsx
    ├── dashboard/
    └── create/
```

## API Layer

### Structure

All API functions are direct exports from `lib/api/`:
```typescript
// lib/api/auth.ts
export async function login(
  walletAddress: string,
  message: string,
  signature: string,
  walletType: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: walletAddress,
      message,
      signature,
      wallet_type: walletType,
    }),
  })
}
```

### Base Client

`lib/api/client.ts` provides:
- Error handling with ApiError and TimeoutError classes
- Request timeout (30 seconds default)
- JSON serialization
- Auth token injection

### Token Management

`lib/api/storage.ts` handles:
- Token persistence in localStorage
- Token retrieval
- Token removal

## Data Management

### React Query Hooks

**Queries** (`hooks/queries/`): Data fetching with caching
```typescript
export function useCurrentUserQuery() {
  return useQuery<User>({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: async () => {
      const token = storage.getToken()
      if (!token) return null
      const apiUser = await authApi.getCurrentUser()
      return transformUser(apiUser)
    },
    enabled: storage.hasToken(),
  })
}
```

**Mutations** (`hooks/mutations/`): Data modifications
```typescript
export function useLoginMutation() {
  const queryClient = useQueryClient()
  
  return useMutation<LoginResult, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      const response = await authApi.login(...)
      storage.setToken(response.access_token)
      return { user: transformUser(...), ... }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user)
      invalidateAuthDependentQueries(queryClient)
    },
  })
}
```

**Unified Hooks** (`hooks/use-*.ts`): Combine queries and mutations
```typescript
export function useAuth() {
  const { data: user, isLoading } = useCurrentUserQuery()
  const loginMutation = useLoginMutation()
  
  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    logout: () => { /* ... */ },
  }
}
```

## Type System

### API Types (`types/api.types.ts`)

Backend response types using snake_case:
```typescript
export interface ApiUser {
  id: string
  wallet_address: string
  wallet_type: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  user_id: string
  wallet_address: string
  pending_documents: string[]
}
```

### UI Types (`types/ui.types.ts`)

Frontend types using camelCase with transformers:
```typescript
export interface User {
  id: string
  walletAddress: string
  walletType: string
  createdAt: string
}

export function transformUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    walletAddress: apiUser.wallet_address,
    walletType: apiUser.wallet_type,
    createdAt: apiUser.created_at,
  }
}
```

## Debug System

### Overview

Centralized logging with categories, levels, and runtime control.

### Configuration

Auto-configures based on environment:
- **Development**: Enabled, DEBUG level, all categories
- **Production**: Disabled, WARN level, runtime enable available

### Categories
```typescript
enum LogCategory {
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
```

### Log Levels
```typescript
enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}
```

### Usage in Code
```typescript
import { logger, LogCategory } from '@/lib/debug'

// Simple logging
logger.info(LogCategory.AUTH, 'User logged in')
logger.error(LogCategory.API, 'Request failed', { error })

// Performance tracking
logger.time(LogCategory.PERFORMANCE, 'operation')
await expensiveOperation()
logger.timeEnd(LogCategory.PERFORMANCE, 'operation')

// Grouped logs
logger.group(LogCategory.AUTH, 'Login Flow')
logger.debug(LogCategory.AUTH, 'Step 1: Verify signature')
logger.debug(LogCategory.AUTH, 'Step 2: Create session')
logger.groupEnd()
```

### React Component Hook
```typescript
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'

function MyComponent() {
  const log = useLogger('MyComponent', LogCategory.COMPONENT)
  
  // Automatically logs mount/unmount
  
  const handleClick = () => {
    log.info('Button clicked', { timestamp: Date.now() })
  }
  
  return <button onClick={handleClick}>Click</button>
}
```

### Runtime Control

Production debugging via browser console:
```javascript
// Enable debug
__LUMIERE_DEBUG__.enable()
__LUMIERE_DEBUG__.setLevel(4)  // DEBUG level

// Filter categories
__LUMIERE_DEBUG__.enableCategory('AUTH')
__LUMIERE_DEBUG__.disableCategory('COMPONENT')

// View configuration
__LUMIERE_DEBUG__.getConfig()

// Export logs
__LUMIERE_LOGGER__.exportLogs()

// Clear logs
__LUMIERE_LOGGER__.clearLogs()
```

## Wallet Integration

### Provider Setup
```typescript
// providers/WalletProvider.tsx
export function WalletProvider({ children }: Props) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  
  // Empty array - wallets auto-detected via Standard Wallet API
  const wallets = useMemo(() => [], [])
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

### Standard Wallet API

Wallets (Phantom, Solflare, Backpack) auto-register via browser detection. No manual adapter registration required.

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Vercel

Application automatically deploys on push to main branch.

Configuration:
- Build command: `npm run build`
- Output directory: `.next`
- Node version: 18.x

### Environment

- **Production**: `NODE_ENV=production` (auto-set by Vercel)
- Debug system disabled by default
- Can be enabled runtime via browser console

## Code Standards

### File Naming

- Components: PascalCase (`WalletPanel.tsx`)
- Hooks: camelCase with `use-` prefix (`use-auth.ts`)
- Utilities: camelCase (`storage.ts`)
- Types: camelCase with `.types.ts` suffix

### Import Organization
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'

// 3. Internal libraries
import { logger, LogCategory } from '@/lib/debug'
import { authApi } from '@/lib/api'

// 4. Components
import { Button } from '@/components/ui/button'

// 5. Types
import type { User } from '@/types/ui.types'
```

### TypeScript

- Strict mode enabled
- No implicit any
- Explicit return types for functions
- Interface over type for objects

## Documentation

- `lib/debug/README.md` - Debug system documentation
- `lib/debug/EXAMPLES.md` - Debug usage examples
- Component documentation in file headers

