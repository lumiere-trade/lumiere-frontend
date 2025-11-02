/**
 * Dependency Injection Container.
 * Central place for wiring up all dependencies (Inversion of Control).
 */

import { BaseApiClient } from '../api/base-api.client'
import { AuthRepository } from '../api/auth.repository'
import { EscrowRepository } from '../api/escrow.repository'
import { SolanaWalletProvider } from '../wallet/solana-wallet-provider'
import { walletStateManager } from '../wallet/wallet-state'
import { authStorage } from '../storage/auth-storage'
import { AuthService } from '@/lib/application/services/auth.service'
import { LegalService } from '@/lib/application/services/legal.service'
import { EscrowService } from '@/lib/application/services/escrow.service'
import { AuthenticateUser } from '@/lib/application/use-cases/authenticate-user'
import { CreateAccount } from '@/lib/application/use-cases/create-account'
import { VerifyWallet } from '@/lib/application/use-cases/verify-wallet'
import { API_CONFIG } from '@/config/constants'

class Container {
  private static instance: Container

  private _apiClient?: BaseApiClient
  private _authRepository?: AuthRepository
  private _escrowRepository?: EscrowRepository
  private _walletProvider?: SolanaWalletProvider
  private _authService?: AuthService
  private _legalService?: LegalService
  private _escrowService?: EscrowService

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  get apiClient(): BaseApiClient {
    if (!this._apiClient) {
      this._apiClient = new BaseApiClient(API_CONFIG.BASE_URL)
      // Initialize with token from storage if available
      const token = authStorage.getToken()
      if (token) {
        this._apiClient.setAuthToken(token)
      }
    }
    return this._apiClient
  }

  get authRepository(): AuthRepository {
    if (!this._authRepository) {
      this._authRepository = new AuthRepository(this.apiClient)
    }
    return this._authRepository
  }

  get escrowRepository(): EscrowRepository {
    if (!this._escrowRepository) {
      this._escrowRepository = new EscrowRepository(this.apiClient)
    }
    return this._escrowRepository
  }

  get walletProvider(): SolanaWalletProvider {
    if (!this._walletProvider) {
      this._walletProvider = new SolanaWalletProvider(
        () => walletStateManager.getState()
      )
    }
    return this._walletProvider
  }

  get authService(): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(
        this.authRepository,
        this.walletProvider,
        authStorage,
        this.updateAuthToken.bind(this)
      )
    }
    return this._authService
  }

  get legalService(): LegalService {
    if (!this._legalService) {
      this._legalService = new LegalService(this.authRepository)
    }
    return this._legalService
  }

  get escrowService(): EscrowService {
    if (!this._escrowService) {
      this._escrowService = new EscrowService(
        this.escrowRepository,
        this.walletProvider
      )
    }
    return this._escrowService
  }

  createAuthenticateUserUseCase(): AuthenticateUser {
    return new AuthenticateUser(this.authService)
  }

  createCreateAccountUseCase(): CreateAccount {
    return new CreateAccount(this.authService, this.legalService)
  }

  createVerifyWalletUseCase(): VerifyWallet {
    return new VerifyWallet(this.authRepository, this.walletProvider)
  }

  updateAuthToken(token: string): void {
    console.log('[Container] updateAuthToken called with:', token?.substring(0, 50) + '...');
    console.log('[Container] Calling authStorage.setToken');
    authStorage.setToken(token);
    console.log('[Container] authStorage.setToken completed');
    console.log('[Container] Calling apiClient.setAuthToken');
    // Update the shared apiClient instance so all repositories have the token
    this.apiClient.setAuthToken(token);
    console.log('[Container] apiClient.setAuthToken completed');
  }

  clearAuthToken(): void {
    authStorage.removeToken()
    // Clear from shared apiClient instance
    this.apiClient.clearAuthToken()
  }

  reset(): void {
    this._apiClient = undefined
    this._authRepository = undefined
    this._escrowRepository = undefined
    this._walletProvider = undefined
    this._authService = undefined
    this._legalService = undefined
    this._escrowService = undefined
  }
}

export const container = Container.getInstance()
