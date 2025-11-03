# Debug System Examples

Real-world examples from Lumiere codebase.

## Example 1: Auth Flow (WalletConnectionModal)

### Before (scattered console.log):
```typescript
console.log('[Wallet] Attempting to connect:', wallet.name)
console.log('[Wallet] Phantom provider found')
console.log('[Auth] Starting authentication...')
console.log('[Auth] Signature obtained')
console.log('[Auth] Verification result:', verifyResult)
```

### After (centralized logger):
```typescript
import { logger, LogCategory } from '@/lib/debug'

logger.info(LogCategory.WALLET, 'Attempting to connect', { wallet: wallet.name })
logger.debug(LogCategory.WALLET, 'Phantom provider found')

logger.group(LogCategory.AUTH, 'Authentication Flow')
logger.info(LogCategory.AUTH, 'Starting authentication')
logger.debug(LogCategory.AUTH, 'Signature obtained', { signatureLength: signature.length })
logger.info(LogCategory.AUTH, 'Verification complete', { 
  signatureValid: verifyResult.signature_valid,
  userExists: verifyResult.user_exists 
})
logger.groupEnd()
```

## Example 2: API Calls

### In lib/api/client.ts:
```typescript
import { logger, LogCategory } from '@/lib/debug'

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  logger.time(LogCategory.API, `${options.method || 'GET'} ${endpoint}`)
  
  logger.debug(LogCategory.API, 'Request starting', {
    endpoint,
    method: options.method || 'GET',
    hasBody: !!options.body
  })

  try {
    const response = await fetchWithTimeout(url, { ...options, headers }, timeout)
    
    logger.timeEnd(LogCategory.API, `${options.method || 'GET'} ${endpoint}`)
    logger.debug(LogCategory.API, 'Request successful', {
      endpoint,
      status: response.status
    })
    
    return handleResponse<T>(response)
  } catch (error) {
    logger.error(LogCategory.API, 'Request failed', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}
```

## Example 3: React Query Hooks

### In hooks/queries/use-auth-queries.ts:
```typescript
import { logger, LogCategory } from '@/lib/debug'

export function useCurrentUserQuery() {
  return useQuery<User>({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: async () => {
      logger.debug(LogCategory.QUERY, 'Fetching current user')
      
      const token = storage.getToken()
      if (token) {
        setAuthToken(token)
        logger.debug(LogCategory.QUERY, 'Auth token found', { 
          tokenPrefix: token.substring(0, 10) + '...' 
        })
      } else {
        logger.warn(LogCategory.QUERY, 'No auth token found')
      }
      
      const apiUser = await authApi.getCurrentUser()
      logger.info(LogCategory.QUERY, 'User fetched successfully', { 
        userId: apiUser.id 
      })
      
      return transformUser(apiUser)
    },
    enabled: storage.hasToken(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
```

## Example 4: Mutations with Error Handling

### In hooks/mutations/use-auth-mutations.ts:
```typescript
import { logger, LogCategory } from '@/lib/debug'

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { publicKey, signMessage } = useWallet()

  return useMutation<LoginResult, Error, void>({
    mutationFn: async () => {
      logger.group(LogCategory.MUTATION, 'Login Mutation')
      
      try {
        if (!publicKey || !signMessage) {
          throw new Error('Wallet not connected')
        }

        const walletAddress = publicKey.toBase58()
        logger.debug(LogCategory.MUTATION, 'Wallet connected', { 
          address: walletAddress.substring(0, 8) + '...' 
        })

        logger.debug(LogCategory.MUTATION, 'Requesting signature')
        const signature = await signMessage(encodedMessage)
        logger.debug(LogCategory.MUTATION, 'Signature obtained')

        logger.debug(LogCategory.MUTATION, 'Verifying wallet')
        const verifyResult = await authApi.verifyWallet(...)
        
        if (!verifyResult.signature_valid) {
          logger.error(LogCategory.MUTATION, 'Invalid signature')
          throw new Error('Invalid signature')
        }

        logger.info(LogCategory.MUTATION, 'Login successful')
        return { user, pendingDocuments }
        
      } finally {
        logger.groupEnd()
      }
    },
    onSuccess: (data) => {
      logger.info(LogCategory.MUTATION, 'Login mutation succeeded', {
        userId: data.user.id,
        hasPendingDocs: data.pendingDocuments.length > 0
      })
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user)
    },
    onError: (error) => {
      logger.error(LogCategory.MUTATION, 'Login mutation failed', {
        error: error.message
      })
    }
  })
}
```

## Example 5: Component Lifecycle Tracking

### In any React component:
```typescript
import { useLogger } from '@/hooks/use-logger'
import { LogCategory } from '@/lib/debug'

export function WalletConnectionModal({ isOpen, onClose }: Props) {
  const log = useLogger('WalletConnectionModal', LogCategory.WALLET)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      log.info('Modal opened')
    } else {
      log.info('Modal closed')
    }
  }, [isOpen])

  const handleWalletClick = async (wallet: WalletOption) => {
    log.time('walletConnection')
    log.info('Wallet selected', { wallet: wallet.name })
    
    setIsProcessing(true)
    
    try {
      await connectWallet(wallet)
      log.info('Wallet connected successfully')
    } catch (error) {
      log.error('Wallet connection failed', { error })
    } finally {
      setIsProcessing(false)
      log.timeEnd('walletConnection')
    }
  }

  return <Dialog>...</Dialog>
}
```

## Example 6: Escrow Operations

### In hooks/use-escrow.ts:
```typescript
import { logger, LogCategory } from '@/lib/debug'

export function useEscrow() {
  const { publicKey } = useWallet()
  
  const { data: escrow, isLoading, error } = useEscrowBalanceQuery(false)
  
  useEffect(() => {
    if (escrow) {
      logger.info(LogCategory.ESCROW, 'Escrow balance loaded', {
        balance: escrow.balance,
        isInitialized: escrow.isInitialized
      })
    }
    
    if (error) {
      logger.error(LogCategory.ESCROW, 'Failed to load escrow balance', { error })
    }
  }, [escrow, error])

  const depositToEscrow = async (amount: string) => {
    logger.group(LogCategory.ESCROW, `Deposit ${amount} USDC`)
    logger.time(LogCategory.PERFORMANCE, 'deposit')
    
    try {
      logger.debug(LogCategory.ESCROW, 'Preparing deposit transaction')
      const result = await depositMutation.mutateAsync(amount)
      
      logger.info(LogCategory.ESCROW, 'Deposit successful', {
        txHash: result.txHash,
        newBalance: result.escrow.balance
      })
      
      return result
    } catch (error) {
      logger.error(LogCategory.ESCROW, 'Deposit failed', { error })
      throw error
    } finally {
      logger.timeEnd(LogCategory.PERFORMANCE, 'deposit')
      logger.groupEnd()
    }
  }

  return { escrow, depositToEscrow, ... }
}
```

## Example 7: Network Errors

### In lib/api/client.ts:
```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    logger.error(LogCategory.NETWORK, 'HTTP Error', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    })

    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
      
      logger.debug(LogCategory.NETWORK, 'Error details', errorData)
    } catch {
      logger.warn(LogCategory.NETWORK, 'Could not parse error response')
    }

    throw new ApiError(errorMessage, response.status)
  }

  return response.json()
}
```

## Example 8: State Changes

### In any component with complex state:
```typescript
const [step, setStep] = useState<'connect' | 'sign' | 'verify'>('connect')

useEffect(() => {
  logger.info(LogCategory.STATE, 'Step changed', { 
    from: previousStep, 
    to: step 
  })
}, [step])
```

## Pro Tips

### 1. Use groups for complex flows:
```typescript
logger.group(LogCategory.AUTH, 'Complete Authentication Flow')
logger.debug(LogCategory.AUTH, 'Step 1: Connect wallet')
logger.debug(LogCategory.AUTH, 'Step 2: Sign message')
logger.debug(LogCategory.AUTH, 'Step 3: Verify signature')
logger.debug(LogCategory.AUTH, 'Step 4: Login')
logger.groupEnd()
```

### 2. Track performance:
```typescript
logger.time(LogCategory.PERFORMANCE, 'expensive-operation')
const result = await expensiveOperation()
logger.timeEnd(LogCategory.PERFORMANCE, 'expensive-operation')
```

### 3. Include context:
```typescript
// Bad
logger.debug(LogCategory.API, 'Request failed')

// Good
logger.debug(LogCategory.API, 'Request failed', {
  endpoint: '/api/users',
  method: 'POST',
  status: 500,
  error: error.message
})
```

### 4. Use appropriate levels:
```typescript
// User actions
logger.info(LogCategory.WALLET, 'User clicked deposit button')

// Technical details
logger.debug(LogCategory.API, 'API response received', { data })

// Warnings
logger.warn(LogCategory.AUTH, 'Token expiring soon', { expiresIn })

// Errors
logger.error(LogCategory.NETWORK, 'Connection failed', { error })
```
