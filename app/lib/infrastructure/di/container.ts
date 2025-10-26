/**
 * Dependency Injection Container.
 * Central place for wiring up all dependencies (Inversion of Control).
 */
import { BaseApiClient } from '../api/base-api.client'
import { AuthRepository } from '../api/auth.repository'
import { EscrowRepository } from '../api/escrow.repository'
import { PasseurRepository } from '../api/passeur.repository'
import { SolanaWalletProvider } from '../wallet/solana-wallet-provider'
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
  private _passeurRepository?: PasseurRepository
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
  
  get escrowRepository(): EscrowRepository {
    if (!this._escrowRepository) {
      this._escrowRepository = new EscrowRepository(this.apiClient)
    }
    return this._escrowRepository
  }
  
  get passeurRepository(): PasseurRepository {
    if (!this._passeurRepository) {
      this._passeurRepository = new PasseurRepository()
    }
    return this._passeurRepository
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
  
  get escrowService(): EscrowService {
    if (!this._escrowService) {
      this._escrowService = new EscrowService(
        this.escrowRepository,
        this.passeurRepository,
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
    this._escrowRepository = undefined
    this._passeurRepository = undefined
    this._walletProvider = undefined
    this._authService = undefined
    this._legalService = undefined
    this._escrowService = undefined
  }
}

export const container = Container.getInstance()
