# LUMIÈRE FRONTEND ARCHITECTURE IMPROVEMENT PLAN
## Comprehensive Analysis & Refactoring Strategy

**Document Version:** 1.0  
**Date:** October 24, 2025  
**Author:** Architecture Review  
**Project:** Lumière - AI-Powered DeFi Trading Platform on Solana

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Identified Problems](#identified-problems)
4. [Target Architecture](#target-architecture)
5. [Migration Strategy](#migration-strategy)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Success Metrics](#success-metrics)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Current State

Lumière frontend currently implements Clean Architecture with:
- ✅ Domain-driven design (entities, value objects, interfaces)
- ✅ Use case pattern (application layer)
- ✅ Dependency inversion (infrastructure layer)
- ⚠️ Mixed state management (React Context for everything)
- ❌ Incomplete error handling
- ❌ No testing infrastructure
- ❌ Basic API layer without resilience

### 1.2 Target State

Production-ready architecture for complex DeFi platform with:
- ✅ Clean Architecture foundation (keep current structure)
- ✅ Proper state management separation (Context + React Query + Zustand)
- ✅ Comprehensive error handling with recovery strategies
- ✅ Real-time data infrastructure (WebSocket)
- ✅ Testing at all layers (unit, integration, e2e)
- ✅ Performance optimization (code splitting, memoization, workers)

### 1.3 Migration Approach

**Incremental refactoring** - не rewrite, а постепенно подобрение:
- Phase 1: Stabilize auth & error handling (1 week)
- Phase 2: State management refactor (1 week)
- Phase 3: Real-time infrastructure (1 week)
- Phase 4: Testing & monitoring (1 week)

---

## 2. CURRENT ARCHITECTURE ANALYSIS

### 2.1 Directory Structure
```
app/
├── (current structure)
│   ├── app/                    ✅ Next.js 13+ app router
│   │   ├── dashboard/          ✅ Dashboard page
│   │   ├── create/             ✅ Strategy creation
│   │   ├── layout.tsx          ✅ Root layout
│   │   └── providers.tsx       ⚠️ All providers in one file
│   │
│   ├── components/
│   │   ├── ui/                 ✅ shadcn/ui components
│   │   ├── wallet/             ✅ Wallet components
│   │   ├── dashboard/          ✅ Dashboard components
│   │   └── strategy/           ✅ Strategy components
│   │
│   ├── lib/
│   │   ├── domain/             ✅ EXCELLENT - Business entities
│   │   │   ├── entities/       → User, LegalDocument
│   │   │   ├── value-objects/  → WalletAddress, Signature
│   │   │   ├── interfaces/     → IAuthRepository, IAuthStorage
│   │   │   └── errors/         → AuthenticationError, etc
│   │   │
│   │   ├── application/        ✅ GOOD - Business logic
│   │   │   ├── use-cases/      → AuthenticateUserUseCase
│   │   │   ├── services/       → AuthService
│   │   │   └── dto/            → Request/Response DTOs
│   │   │
│   │   ├── infrastructure/     ⚠️ NEEDS IMPROVEMENT
│   │   │   ├── api/            → AuthRepository (basic)
│   │   │   ├── storage/        → AuthStorage (localStorage)
│   │   │   └── solana/         → WalletAdapter
│   │   │
│   │   └── utils.ts            ✅ Utility functions
│   │
│   ├── hooks/
│   │   ├── use-auth.ts         ⚠️ Returns both state & methods
│   │   ├── use-wallet.ts       ✅ Wallet hook
│   │   └── use-toast.ts        ✅ Toast notifications
│   │
│   ├── contexts/
│   │   └── AdminAuthContext.tsx ✅ Admin auth
│   │
│   └── types/
│       └── api.types.ts        ⚠️ Should be in domain layer
```

### 2.2 Dependencies Analysis

**Current Stack:**
```json
{
  "next": "15.0.2",
  "react": "^19.0.0",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/web3.js": "^1.95.8",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.263.1"
}
```

**Missing Critical Dependencies:**
- ❌ State management: `@tanstack/react-query`, `zustand`
- ❌ State machines: `xstate`
- ❌ Testing: `vitest`, `@testing-library/react`, `playwright`
- ❌ WebSocket: `ws`, `reconnecting-websocket`
- ❌ Error tracking: `@sentry/nextjs`
- ❌ Performance: `@tanstack/react-virtual`

### 2.3 Current Data Flow
```
Component
   ↓
useAuth() hook
   ↓
React Context (holds BOTH state & service)
   ↓
AuthService (business logic)
   ↓
AuthRepository (API calls)
   ↓
Backend API
```

**Problems:**
- Context re-renders entire tree on any state change
- No request caching or deduplication
- No optimistic updates
- No error recovery strategies

---

## 3. IDENTIFIED PROBLEMS

### 3.1 CRITICAL Issues (Must Fix Before Production)

#### Problem 1: Mixed State Management Anti-pattern

**Current:**
```typescript
// hooks/use-auth.ts
export function useAuth() {
  const context = useContext(AuthContext)
  return {
    user: context.user,              // State
    login: context.login,            // Method
    logout: context.logout,          // Method
    isAuthenticated: context.isAuthenticated  // Derived state
  }
}
```

**Why This Is Bad:**
- ❌ Every component using `useAuth()` re-renders when `user` changes, even if they only need `login` method
- ❌ Cannot optimize re-renders with `useMemo` or `useCallback`
- ❌ Testing is difficult (need to wrap in Context provider)

**Impact:** Performance degradation with >50 components

---

#### Problem 2: No Error Boundary Strategy

**Current:**
```typescript
// lib/domain/errors/auth.errors.ts
export class AuthenticationError extends Error {}
export class InvalidSignatureError extends Error {}
export class UserNotFoundError extends Error {}
```

**What's Missing:**
- ❌ No global error boundary to catch unhandled errors
- ❌ No error recovery strategies (retry, fallback)
- ❌ No user-friendly error messages
- ❌ No error logging/tracking

**Impact:** App crashes on unhandled errors, poor UX

---

#### Problem 3: Naive API Layer

**Current:**
```typescript
// lib/infrastructure/api/auth.repository.ts
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  
  if (!response.ok) throw new Error('Login failed')
  return response.json()
}
```

**What's Missing:**
- ❌ No retry logic (network failures)
- ❌ No request cancellation (component unmount)
- ❌ No timeout handling
- ❌ No request deduplication (prevent double-submit)
- ❌ No caching strategy
- ❌ No loading states management

**Impact:** Poor UX on slow/unreliable networks, wasted API calls

---

#### Problem 4: Boolean Flags Instead of State Machine

**Current:**
```typescript
const [isLoading, setIsLoading] = useState(false)
const [isAuthenticated, setIsAuthenticated] = useState(false)
const [error, setError] = useState<Error | null>(null)
```

**Problem:** Allows invalid states:
- `isLoading=true && isAuthenticated=true` ❌
- `isLoading=false && error=null && user=null` (what state is this?)
- Race conditions between state updates

**Impact:** Bugs, inconsistent UI, hard to debug

---

### 3.2 HIGH Priority Issues (Needed for Scale)

#### Problem 5: No Real-time Data Infrastructure

**For Chronicler (market data) you need:**
- WebSocket connection to price feeds
- Automatic reconnection on disconnect
- Buffering updates during reconnection
- Efficient state updates (don't re-render on every tick)

**Currently:** Nothing implemented

---

#### Problem 6: No Testing Infrastructure

**Current:**
- ❌ No unit tests for domain logic
- ❌ No integration tests for API layer
- ❌ No e2e tests for critical flows
- ❌ No test utilities or factories

**Impact:** Fear of refactoring, high bug rate, slow development

---

#### Problem 7: No Performance Optimization

**Missing:**
- Code splitting (all code loads on initial page)
- Component memoization (unnecessary re-renders)
- Virtual scrolling (for long lists)
- Web Workers (for heavy calculations like backtesting)

---

### 3.3 MEDIUM Priority Issues (Nice to Have)

#### Problem 8: Inconsistent Type Safety

**Current:**
```typescript
// types/api.types.ts - should be in domain
export interface User {
  id: string
  walletAddress: string
}

// lib/domain/entities/User.ts - different definition
export class User {
  constructor(
    public readonly id: UserId,
    public readonly walletAddress: WalletAddress
  ) {}
}
```

Two different User types = confusion

---

#### Problem 9: No Feature Flags System

**Needed for:**
- Gradual rollout of new features
- A/B testing
- Kill switch for buggy features

---

#### Problem 10: No Observability

**Missing:**
- Performance monitoring (Core Web Vitals)
- Error tracking (Sentry)
- Analytics (user behavior)
- Logging (structured logs)

---

## 4. TARGET ARCHITECTURE

### 4.1 Improved Directory Structure
```
app/
├── app/
│   ├── (auth)/                     → Auth route group
│   │   ├── login/
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                → Dashboard route group
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   └── layout.tsx
│   │
│   ├── (trading)/                  → Trading route group
│   │   ├── create/
│   │   ├── backtest/
│   │   └── layout.tsx
│   │
│   ├── layout.tsx
│   └── providers.tsx
│
├── components/
│   ├── shared/                     → Pure UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   │
│   ├── features/                   → Feature-specific components
│   │   ├── auth/
│   │   │   ├── WalletConnectionModal/
│   │   │   └── LoginForm/
│   │   │
│   │   ├── strategy/
│   │   │   ├── StrategyBuilder/
│   │   │   ├── StrategyCard/
│   │   │   └── BacktestResults/
│   │   │
│   │   ├── trading/
│   │   │   ├── TradingPanel/
│   │   │   ├── OrderBook/
│   │   │   └── PriceChart/
│   │   │
│   │   └── portfolio/
│   │       ├── PositionsList/
│   │       └── PerformanceChart/
│   │
│   └── layouts/
│       ├── DashboardLayout/
│       └── TradingLayout/
│
├── lib/
│   ├── domain/                     → ✅ KEEP AS IS (excellent)
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Strategy.ts
│   │   │   ├── Trade.ts
│   │   │   ├── Position.ts
│   │   │   └── MarketData.ts
│   │   │
│   │   ├── value-objects/
│   │   │   ├── WalletAddress.ts
│   │   │   ├── TokenAmount.ts
│   │   │   ├── Percentage.ts
│   │   │   └── Signature.ts
│   │   │
│   │   ├── interfaces/             → Repository contracts
│   │   │   ├── IAuthRepository.ts
│   │   │   ├── IStrategyRepository.ts
│   │   │   ├── ITradingRepository.ts
│   │   │   └── IMarketDataRepository.ts
│   │   │
│   │   └── errors/                 → Domain-specific errors
│   │       ├── auth.errors.ts
│   │       ├── strategy.errors.ts
│   │       ├── trading.errors.ts
│   │       └── network.errors.ts
│   │
│   ├── application/                → ✅ KEEP & EXPAND
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── authenticate-user.use-case.ts
│   │   │   │   ├── create-account.use-case.ts
│   │   │   │   └── refresh-session.use-case.ts
│   │   │   │
│   │   │   ├── strategy/
│   │   │   │   ├── create-strategy.use-case.ts
│   │   │   │   ├── backtest-strategy.use-case.ts
│   │   │   │   └── deploy-strategy.use-case.ts
│   │   │   │
│   │   │   └── trading/
│   │   │       ├── execute-trade.use-case.ts
│   │   │       └── close-position.use-case.ts
│   │   │
│   │   ├── services/               → Application services
│   │   │   ├── auth.service.ts
│   │   │   ├── strategy.service.ts
│   │   │   └── trading.service.ts
│   │   │
│   │   ├── dto/                    → Data Transfer Objects
│   │   │   ├── auth.dto.ts
│   │   │   ├── strategy.dto.ts
│   │   │   └── trading.dto.ts
│   │   │
│   │   └── state-machines/         → NEW: Complex workflows
│   │       ├── auth-flow.machine.ts
│   │       └── strategy-creation.machine.ts
│   │
│   ├── infrastructure/             → ⚠️ MAJOR IMPROVEMENTS NEEDED
│   │   ├── api/                    → HTTP repositories
│   │   │   ├── base-api.client.ts  → NEW: Base client with retry/timeout
│   │   │   ├── auth.repository.ts
│   │   │   ├── strategy.repository.ts
│   │   │   └── trading.repository.ts
│   │   │
│   │   ├── blockchain/             → Solana integration
│   │   │   ├── solana.client.ts
│   │   │   ├── solana.monitor.ts   → NEW: Listen for on-chain events
│   │   │   ├── solana.validator.ts → NEW: Validate signatures/balances
│   │   │   └── wallet-adapter.ts
│   │   │
│   │   ├── websocket/              → NEW: Real-time data
│   │   │   ├── websocket.client.ts
│   │   │   ├── websocket.reconnect.ts
│   │   │   └── websocket.heartbeat.ts
│   │   │
│   │   ├── storage/                → Client-side storage
│   │   │   ├── local-storage.adapter.ts
│   │   │   ├── indexed-db.adapter.ts → NEW: For large data
│   │   │   └── session-storage.adapter.ts
│   │   │
│   │   └── cache/                  → NEW: Cache strategies
│   │       ├── query-client.config.ts
│   │       └── cache-keys.ts
│   │
│   └── presentation/               → NEW: Presentation layer
│       ├── contexts/               → React Contexts (state only)
│       │   ├── AuthStateContext.tsx
│       │   ├── ThemeContext.tsx
│       │   └── LocaleContext.tsx
│       │
│       ├── hooks/                  → Custom hooks
│       │   ├── queries/            → React Query hooks
│       │   │   ├── use-auth-queries.ts
│       │   │   ├── use-strategy-queries.ts
│       │   │   └── use-market-data-queries.ts
│       │   │
│       │   ├── mutations/          → React Query mutations
│       │   │   ├── use-auth-mutations.ts
│       │   │   ├── use-strategy-mutations.ts
│       │   │   └── use-trading-mutations.ts
│       │   │
│       │   ├── state/              → Local state hooks
│       │   │   ├── use-ui-state.ts
│       │   │   └── use-filters.ts
│       │   │
│       │   └── services/           → Service access hooks
│       │       ├── use-auth-service.ts
│       │       ├── use-strategy-service.ts
│       │       └── use-trading-service.ts
│       │
│       ├── providers/              → Provider components
│       │   ├── QueryProvider.tsx
│       │   ├── AuthProvider.tsx
│       │   ├── ThemeProvider.tsx
│       │   └── ErrorBoundaryProvider.tsx
│       │
│       └── stores/                 → NEW: Zustand stores
│           ├── ui.store.ts         → Modal states, filters, preferences
│           └── trading.store.ts    → Trading UI state
│
├── config/
│   ├── api.config.ts
│   ├── blockchain.config.ts
│   ├── websocket.config.ts
│   ├── feature-flags.ts            → NEW: Feature flags
│   └── constants.ts
│
├── workers/                         → NEW: Web Workers
│   ├── backtest.worker.ts          → Heavy calculations
│   └── data-processing.worker.ts
│
└── tests/                          → NEW: Test infrastructure
    ├── unit/
    │   ├── domain/
    │   ├── use-cases/
    │   └── utils/
    │
    ├── integration/
    │   ├── api/
    │   └── blockchain/
    │
    ├── e2e/
    │   ├── auth-flow.spec.ts
    │   ├── strategy-creation.spec.ts
    │   └── trading.spec.ts
    │
    └── fixtures/
        ├── users.ts
        ├── strategies.ts
        └── trades.ts
```

### 4.2 Improved Data Flow

#### Old Flow (Current):
```
Component → useAuth() → Context → Service → Repository → API
          ↑___________________________________________|
                    (re-renders entire tree)
```

#### New Flow (Target):
```
Component → useAuthState() → React Context → (minimal re-renders)
         ↘
          → useLogin() → React Query → Service → Repository → API
                              ↑________________________|
                                  (automatic caching)
```

### 4.3 State Management Strategy

**Three-tier approach:**
```typescript
// 1. SERVER STATE (React Query)
// For data that comes from backend
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: () => authRepository.getCurrentUser()
})

const { mutate: login } = useMutation({
  mutationFn: (credentials) => authService.login(credentials),
  onSuccess: () => queryClient.invalidateQueries(['user'])
})

// 2. GLOBAL UI STATE (Zustand)
// For UI preferences, modal states, etc
const useUIStore = create((set) => ({
  isModalOpen: false,
  selectedStrategy: null,
  openModal: (strategy) => set({ isModalOpen: true, selectedStrategy: strategy })
}))

// 3. AUTHENTICATION STATE (React Context)
// For rarely-changing global state
const { user, isAuthenticated } = useAuthState()
```

### 4.4 Error Handling Architecture
```typescript
// 1. Global Error Boundary
<ErrorBoundary
  fallback={<ErrorPage />}
  onError={(error) => Sentry.captureException(error)}
>
  <App />
</ErrorBoundary>

// 2. Feature-specific Error Boundaries
<ErrorBoundary fallback={<TradingError />}>
  <TradingPanel />
</ErrorBoundary>

// 3. Error Recovery Strategies
const { mutate, error } = useMutation({
  mutationFn: executeTrade,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    if (error instanceof InsufficientBalanceError) {
      showToast('Insufficient balance', 'error')
    } else if (error instanceof NetworkError) {
      showToast('Network error, retrying...', 'warning')
    }
  }
})

// 4. Typed Error Classes
class InsufficientBalanceError extends DomainError {
  constructor(required: TokenAmount, available: TokenAmount) {
    super(`Insufficient balance: need ${required}, have ${available}`)
  }
}
```

### 4.5 Real-time Data Architecture
```typescript
// infrastructure/websocket/websocket.client.ts
class WebSocketClient {
  connect(url: string): void
  subscribe(channel: string, callback: (data) => void): void
  unsubscribe(channel: string): void
  reconnect(): void
}

// hooks/queries/use-market-data-queries.ts
export function useMarketData(tokenPair: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const ws = new WebSocketClient()
    ws.connect(WEBSOCKET_URL)
    ws.subscribe(`price:${tokenPair}`, (data) => {
      // Update React Query cache
      queryClient.setQueryData(['market-data', tokenPair], data)
    })
    
    return () => ws.unsubscribe(`price:${tokenPair}`)
  }, [tokenPair])
  
  return useQuery({
    queryKey: ['market-data', tokenPair],
    queryFn: () => fetchInitialMarketData(tokenPair)
  })
}
```

---

## 5. MIGRATION STRATEGY

### 5.1 Principles

1. **Incremental, not big-bang** - migrate one feature at a time
2. **Test-driven** - write tests before refactoring
3. **No breaking changes** - maintain API compatibility during migration
4. **Feature flags** - gradually roll out new architecture
5. **Measure impact** - monitor performance metrics

### 5.2 Migration Order
```
Phase 1: Foundation (Week 1)
├── Install dependencies (React Query, Zustand, XState, Vitest)
├── Setup error boundaries
├── Create base API client with retry/timeout
└── Add basic testing infrastructure

Phase 2: State Management (Week 2)
├── Migrate auth to React Query
├── Create Zustand store for UI state
├── Refactor hooks (separate state from methods)
└── Add tests for new hooks

Phase 3: Real-time Infrastructure (Week 3)
├── Implement WebSocket client
├── Create market data hooks
├── Add reconnection logic
└── Test WebSocket reliability

Phase 4: Production Hardening (Week 4)
├── Add performance optimizations
├── Implement monitoring (Sentry)
├── Write e2e tests
└── Load testing
```

### 5.3 Step-by-Step Migration Example: Auth Module

#### Step 1: Install Dependencies
```bash
npm install @tanstack/react-query zustand xstate
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

#### Step 2: Create Query Client Config
```typescript
// lib/infrastructure/cache/query-client.config.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

#### Step 3: Create React Query Hooks
```typescript
// lib/presentation/hooks/queries/use-auth-queries.ts
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/lib/application/services/auth.service'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!authService.getToken(), // Only fetch if token exists
  })
}

// lib/presentation/hooks/mutations/use-auth-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/application/services/auth.service'

export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(['user'], data.user)
      // Invalidate related queries
      queryClient.invalidateQueries(['strategies'])
    },
    onError: (error) => {
      console.error('Login failed:', error)
    },
  })
}
```

#### Step 4: Create Lightweight Context (State Only)
```typescript
// lib/presentation/contexts/AuthStateContext.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCurrentUser } from '../hooks/queries/use-auth-queries'

interface AuthStateContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined)

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser()
  
  return (
    <AuthStateContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthStateContext.Provider>
  )
}

export function useAuthState() {
  const context = useContext(AuthStateContext)
  if (!context) throw new Error('useAuthState must be within AuthStateProvider')
  return context
}
```

#### Step 5: Update Components
```typescript
// Before (old way)
function DashboardPage() {
  const { user, login, logout } = useAuth() // ❌ Gets both state & methods
  
  return <div>{user?.walletAddress}</div>
}

// After (new way)
function DashboardPage() {
  const { user } = useAuthState()           // ✅ Only state
  const { mutate: login } = useLogin()      // ✅ Only when needed
  const { mutate: logout } = useLogout()    // ✅ Only when needed
  
  return <div>{user?.walletAddress}</div>
}
```

#### Step 6: Add Tests
```typescript
// tests/unit/hooks/use-auth-mutations.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin } from '@/lib/presentation/hooks/mutations/use-auth-mutations'

describe('useLogin', () => {
  it('should login successfully', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    
    const { result } = renderHook(() => useLogin(), { wrapper })
    
    result.current.mutate({
      walletAddress: 'test123',
      signature: 'sig123',
    })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.user).toBeDefined()
  })
})
```

---

## 6. IMPLEMENTATION ROADMAP

### 6.1 PHASE 1: Foundation (Week 1)

#### Day 1-2: Setup Infrastructure
```bash
# Install dependencies
npm install @tanstack/react-query@^5.0.0
npm install zustand@^4.5.0
npm install xstate@^5.0.0
npm install @sentry/nextjs@^8.0.0

npm install -D vitest@^1.0.0
npm install -D @testing-library/react@^14.0.0
npm install -D @testing-library/jest-dom@^6.0.0
npm install -D @playwright/test@^1.40.0
npm install -D msw@^2.0.0

# Create config files
touch vitest.config.ts
touch playwright.config.ts
touch lib/infrastructure/cache/query-client.config.ts
```

**Tasks:**
- [ ] Install all dependencies
- [ ] Configure Vitest for unit/integration tests
- [ ] Configure Playwright for e2e tests
- [ ] Setup MSW for API mocking
- [ ] Create query client config
- [ ] Setup Sentry for error tracking

**Deliverable:** Working test infrastructure

---

#### Day 3-4: Error Handling Foundation
```typescript
// Create base error classes
lib/domain/errors/
  ├── base.error.ts              → DomainError base class
  ├── network.error.ts           → NetworkError, TimeoutError
  └── validation.error.ts        → ValidationError

// Create error boundary components
components/shared/ErrorBoundary/
  ├── ErrorBoundary.tsx
  ├── ErrorFallback.tsx
  └── error-utils.ts

// Create error recovery strategies
lib/infrastructure/api/
  └── error-recovery.ts          → Retry logic, exponential backoff
```

**Tasks:**
- [ ] Create error class hierarchy
- [ ] Implement ErrorBoundary component
- [ ] Add retry logic to API client
- [ ] Create user-friendly error messages
- [ ] Integrate Sentry

**Deliverable:** Comprehensive error handling

---

#### Day 5: Improved API Client
```typescript
// lib/infrastructure/api/base-api.client.ts
export class BaseApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
      })
      
      clearTimeout(timeout)
      
      if (!response.ok) {
        throw await this.handleError(response)
      }
      
      return response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timeout')
      }
      throw error
    }
  }
  
  async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    // Implement exponential backoff retry
  }
}
```

**Tasks:**
- [ ] Create base API client with timeout
- [ ] Add request cancellation support
- [ ] Implement retry with exponential backoff
- [ ] Add request deduplication
- [ ] Write unit tests

**Deliverable:** Production-ready API client

---

### 6.2 PHASE 2: State Management Refactor (Week 2)

#### Day 1-2: Auth Migration to React Query
```typescript
// Create new hooks structure
lib/presentation/hooks/
  ├── queries/
  │   └── use-auth-queries.ts    → useCurrentUser, useLegalDocuments
  ├── mutations/
  │   └── use-auth-mutations.ts  → useLogin, useCreateAccount, useLogout
  └── services/
      └── use-auth-service.ts    → Access to AuthService

// Create lightweight context
lib/presentation/contexts/
  └── AuthStateContext.tsx       → Only holds user state
```

**Tasks:**
- [ ] Create React Query hooks for auth
- [ ] Create AuthStateContext (state only)
- [ ] Migrate WalletConnectionModal to new hooks
- [ ] Migrate Dashboard to new hooks
- [ ] Write tests for new hooks
- [ ] Remove old useAuth hook

**Deliverable:** Auth fully migrated to React Query

---

#### Day 3-4: UI State with Zustand
```typescript
// lib/presentation/stores/ui.store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  // Modal states
  isWalletModalOpen: boolean
  isStrategyModalOpen: boolean
  
  // Filters
  strategyFilters: StrategyFilters
  
  // Preferences
  theme: 'light' | 'dark'
  
  // Actions
  openWalletModal: () => void
  closeWalletModal: () => void
  setStrategyFilters: (filters: StrategyFilters) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        isWalletModalOpen: false,
        theme: 'dark',
        
        openWalletModal: () => set({ isWalletModalOpen: true }),
        closeWalletModal: () => set({ isWalletModalOpen: false }),
      }),
      { name: 'lumiere-ui-state' }
    )
  )
)
```

**Tasks:**
- [ ] Create UI store for modal states
- [ ] Create UI store for filters/preferences
- [ ] Migrate modal management to Zustand
- [ ] Add persistence for user preferences
- [ ] Write tests

**Deliverable:** UI state managed by Zustand

---

#### Day 5: State Machine for Complex Flows
```typescript
// lib/application/state-machines/auth-flow.machine.ts
import { createMachine, assign } from 'xstate'

export const authFlowMachine = createMachine({
  id: 'authFlow',
  initial: 'idle',
  states: {
    idle: {
      on: {
        CONNECT_WALLET: 'connectingWallet'
      }
    },
    connectingWallet: {
      invoke: {
        src: 'connectWallet',
        onDone: {
          target: 'walletConnected',
          actions: assign({ wallet: (_, event) => event.data })
        },
        onError: 'error'
      }
    },
    walletConnected: {
      on: {
        SIGN_MESSAGE: 'signingMessage'
      }
    },
    signingMessage: {
      invoke: {
        src: 'signMessage',
        onDone: {
          target: 'authenticating',
          actions: assign({ signature: (_, event) => event.data })
        },
        onError: 'error'
      }
    },
    authenticating: {
      invoke: {
        src: 'authenticate',
        onDone: 'authenticated',
        onError: 'error'
      }
    },
    authenticated: {
      type: 'final'
    },
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  }
})
```

**Tasks:**
- [ ] Create auth flow state machine
- [ ] Create strategy creation state machine
- [ ] Integrate with React components
- [ ] Add visual state diagram in docs
- [ ] Write tests

**Deliverable:** Complex flows managed by state machines

---

### 6.3 PHASE 3: Real-time Infrastructure (Week 3)

#### Day 1-2: WebSocket Client
```typescript
// lib/infrastructure/websocket/websocket.client.ts
export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private subscriptions = new Map<string, Set<Function>>()
  
  connect(url: string): void {
    this.ws = new WebSocket(url)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }
    
    this.ws.onmessage = (event) => {
      const { channel, data } = JSON.parse(event.data)
      this.notifySubscribers(channel, data)
    }
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...')
      this.reconnect()
    }
  }
  
  subscribe(channel: string, callback: Function): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      this.ws?.send(JSON.stringify({ type: 'subscribe', channel }))
    }
    this.subscriptions.get(channel)?.add(callback)
  }
  
  private reconnect(): void {
    if (this.reconnectAttempts >= 5) {
      console.error('Max reconnect attempts reached')
      return
    }
    
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect(this.url)
    }, Math.min(1000 * 2 ** this.reconnectAttempts, 30000))
  }
}
```

**Tasks:**
- [ ] Implement WebSocket client
- [ ] Add automatic reconnection
- [ ] Add heartbeat mechanism
- [ ] Handle connection errors
- [ ] Write tests

**Deliverable:** Reliable WebSocket client

---

#### Day 3-4: Market Data Integration
```typescript
// lib/presentation/hooks/queries/use-market-data-queries.ts
export function useMarketData(tokenPair: string) {
  const queryClient = useQueryClient()
  
  // Initial data fetch
  const query = useQuery({
    queryKey: ['market-data', tokenPair],
    queryFn: () => marketDataRepository.getMarketData(tokenPair),
  })
  
  // WebSocket updates
  useEffect(() => {
    const ws = getWebSocketClient()
    
    ws.subscribe(`price:${tokenPair}`, (data: PriceUpdate) => {
      queryClient.setQueryData(['market-data', tokenPair], (old) => ({
        ...old,
        ...data,
      }))
    })
    
    return () => ws.unsubscribe(`price:${tokenPair}`)
  }, [tokenPair])
  
  return query
}
```

**Tasks:**
- [ ] Create market data hooks
- [ ] Integrate WebSocket with React Query
- [ ] Add data buffering during reconnection
- [ ] Optimize re-renders (use selector pattern)
- [ ] Write integration tests

**Deliverable:** Real-time market data working

---

#### Day 5: Performance Optimization
```typescript
// Memoization
const Chart = memo(TradingChart, (prev, next) => 
  prev.data.length === next.data.length &&
  prev.tokenPair === next.tokenPair
)

// Virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual'

function StrategyList({ strategies }) {
  const parentRef = useRef(null)
  
  const rowVirtualizer = useVirtualizer({
    count: strategies.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  })
  
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      {rowVirtualizer.getVirtualItems().map((virtualItem) => (
        <StrategyCard key={virtualItem.key} strategy={strategies[virtualItem.index]} />
      ))}
    </div>
  )
}
```

**Tasks:**
- [ ] Add memoization to heavy components
- [ ] Implement virtual scrolling for lists
- [ ] Add code splitting for routes
- [ ] Optimize bundle size
- [ ] Measure Core Web Vitals

**Deliverable:** Optimized performance

---

### 6.4 PHASE 4: Production Hardening (Week 4)

#### Day 1-2: Comprehensive Testing
```typescript
// E2E test example
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete auth flow', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard')
  
  // Should show wallet modal
  await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible()
  
  // Connect wallet
  await page.click('[data-testid="phantom-button"]')
  
  // Sign message
  await page.waitForSelector('[data-testid="sign-message"]')
  await page.click('[data-testid="sign-button"]')
  
  // Should be authenticated
  await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
  await expect(page.locator('[data-testid="wallet-address"]')).toContainText('...')
})
```

**Tasks:**
- [ ] Write unit tests for all use cases
- [ ] Write integration tests for repositories
- [ ] Write e2e tests for critical flows
- [ ] Achieve >80% code coverage
- [ ] Setup CI/CD test pipeline

**Deliverable:** Comprehensive test suite

---

#### Day 3: Monitoring & Observability
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },
})

// Custom metrics
Sentry.metrics.distribution('trade.execution.time', executionTime, {
  unit: 'millisecond',
  tags: { tokenPair: 'SOL/USDC' },
})
```

**Tasks:**
- [ ] Setup Sentry for error tracking
- [ ] Add performance monitoring
- [ ] Create custom metrics
- [ ] Setup alerts for critical errors
- [ ] Add user feedback mechanism

**Deliverable:** Full observability

---

#### Day 4-5: Documentation & Deployment
```markdown
# docs/ARCHITECTURE.md
# docs/API.md
# docs/STATE_MANAGEMENT.md
# docs/ERROR_HANDLING.md
# docs/TESTING.md
# docs/DEPLOYMENT.md
```

**Tasks:**
- [ ] Write comprehensive architecture docs
- [ ] Document all APIs and hooks
- [ ] Create developer onboarding guide
- [ ] Setup staging environment
- [ ] Create deployment checklist
- [ ] Perform load testing

**Deliverable:** Production-ready deployment

---

## 7. SUCCESS METRICS

### 7.1 Technical Metrics

**Performance:**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1

**Reliability:**
- [ ] Error rate < 0.1%
- [ ] 99.9% uptime
- [ ] WebSocket reconnection success rate > 95%

**Code Quality:**
- [ ] Test coverage > 80%
- [ ] Zero critical Lighthouse issues
- [ ] TypeScript strict mode enabled
- [ ] ESLint errors = 0

### 7.2 Developer Experience Metrics

- [ ] New feature development time reduced by 30%
- [ ] Bug fix time reduced by 50%
- [ ] Developer onboarding time < 2 days
- [ ] CI/CD pipeline < 10 minutes

### 7.3 User Experience Metrics

- [ ] Modal response time < 100ms
- [ ] Chart rendering < 500ms
- [ ] Trade execution feedback < 1s
- [ ] Zero infinite loops or race conditions

---

## 8. RISK MITIGATION

### 8.1 Technical Risks

**Risk: Breaking changes during migration**
- Mitigation: Feature flags, gradual rollout
- Rollback plan: Keep old code until new code is proven

**Risk: Performance regression**
- Mitigation: Continuous monitoring, load testing
- Rollback plan: A/B testing to compare old vs new

**Risk: WebSocket reliability issues**
- Mitigation: Extensive testing, fallback to polling
- Rollback plan: Graceful degradation

### 8.2 Timeline Risks

**Risk: Migration takes longer than 4 weeks**
- Mitigation: Focus on MVP features first
- Contingency: Extend timeline or reduce scope

**Risk: Bugs in production**
- Mitigation: Comprehensive testing, staged rollout
- Contingency: Quick rollback mechanism

---

## 9. CONCLUSION

This architecture improvement plan provides a clear path from the current state to a production-ready, scalable frontend for Lumière.

**Key Takeaways:**

1. **Keep Clean Architecture foundation** - It's excellent for domain logic
2. **Fix state management** - Separate concerns (Context + React Query + Zustand)
3. **Add error handling** - Critical for production reliability
4. **Build real-time infrastructure** - Essential for market data
5. **Comprehensive testing** - Enables confident refactoring
6. **Incremental migration** - Reduces risk, maintains velocity

**Next Steps:**

1. Review this document with team
2. Prioritize phases based on business needs
3. Start Phase 1 implementation
4. Regular progress reviews (weekly)
5. Adjust plan based on learnings

**Estimated Timeline:** 4 weeks for core improvements, 2 additional weeks for Polish & optimization

**Estimated Effort:** 1 senior frontend developer full-time

---

**Document Status:** Draft v1.0  
**Last Updated:** October 24, 2025  
**Author:** Architecture Review Team  
**Approved By:** [Pending]

