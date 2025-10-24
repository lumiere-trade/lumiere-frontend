/**
 * Dependency Injection Container.
 * Central place for wiring up all dependencies (Inversion of Control).
 */
import { BaseApiClient } from '../api/base-api.client'
import { AuthRepository } from '../api/auth.repository'
import { SolanaWalletProvider } from '../wallet/solana-wallet-provider'
import { authStorage } from '../storage/auth-storage'
import { AuthService } from '@/lib/application/services/auth.service'
import { LegalService } from '@/lib/application/services/legal.service'
import { AuthenticateUser } from '@/lib/application/use-cases/authenticate-user'
import { CreateAccount } from '@/lib/application/use-cases/create-account'
import { VerifyWallet } from '@/lib/application/use-cases/verify-wallet'
import { API_CONFIG } from '@/config/constants'

class Container {
  private static instance: Container
  private _apiClient?: BaseApiClient
  private _authRepository?: AuthRepository
  private _walletProvider?: SolanaWalletProvider
  private _authService?: AuthService
  private _legalService?: LegalService

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
    }
    return this._apiClient
  }

  get authRepository(): AuthRepository {
    if (!this._authRepository) {
      this._authRepository = new AuthRepository(this.apiClient)
      
      // Set auth token if exists
      const token = authStorage.getToken()
      if (token) {
        this._authRepository.setAuthToken(token)
      }
    }
    return this._authRepository
  }

  get walletProvider(): SolanaWalletProvider {
    if (!this._walletProvider) {
      this._walletProvider = new SolanaWalletProvider()
    }
    return this._walletProvider
  }

  get authService(): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(
        this.authRepository,
        this.walletProvider,
        authStorage
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
    authStorage.setToken(token)
    this.authRepository.setAuthToken(token)
  }

  clearAuthToken(): void {
    authStorage.removeToken()
    this.authRepository.clearAuthToken()
  }

  reset(): void {
    this._apiClient = undefined
    this._authRepository = undefined
    this._walletProvider = undefined
    this._authService = undefined
    this._legalService = undefined
  }
}

export const container = Container.getInstance()
