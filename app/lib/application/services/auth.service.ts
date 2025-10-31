/**
 * Auth Service (Application Layer).
 * Orchestrates authentication business logic.
 */
import type { IAuthRepository } from '@/lib/domain/interfaces/auth.repository.interface';
import type { IWalletProvider } from '@/lib/domain/interfaces/wallet.provider.interface';
import type { IStorage } from '@/lib/domain/interfaces/storage.interface';
import { User } from '@/lib/domain/entities/user.entity';
import { PendingDocument } from '@/lib/domain/entities/pending-document.entity';
import { AUTH_CONFIG } from '@/config/constants';
import {
  InvalidSignatureError,
  UserNotFoundError,
} from '@/lib/domain/errors/auth.errors';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  pendingDocuments: PendingDocument[];
}

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly walletProvider: IWalletProvider,
    private readonly storage: IStorage,
    private readonly updateToken: (token: string) => void
  ) {}

  async verifyAndLogin(): Promise<AuthState> {
    const address = this.walletProvider.getAddress();

    if (!address) {
      return {
        user: null,
        isAuthenticated: false,
        pendingDocuments: [],
      };
    }

    const message = AUTH_CONFIG.MESSAGE;
    const { signature } = await this.walletProvider.signMessage(message);

    const verifyResult = await this.authRepository.verifyWallet(
      address,
      message,
      signature
    );

    if (!verifyResult.signatureValid) {
      throw new InvalidSignatureError();
    }

    if (!verifyResult.userExists) {
      throw new UserNotFoundError('Please create an account first');
    }

    const walletType = this.walletProvider.getWalletType();
    const loginResult = await this.authRepository.login(
      address,
      message,
      signature,
      walletType
    );

    this.updateToken(loginResult.accessToken);

    return {
      user: loginResult.user,
      isAuthenticated: true,
      pendingDocuments: loginResult.pendingDocuments,
    };
  }

  async createAccount(acceptedDocumentIds: string[]): Promise<AuthState> {
    const address = this.walletProvider.getAddress();

    if (!address) {
      throw new Error('Wallet not connected');
    }

    const message = AUTH_CONFIG.MESSAGE;
    const { signature } = await this.walletProvider.signMessage(message);
    const walletType = this.walletProvider.getWalletType();

    const result = await this.authRepository.createAccount(
      address,
      message,
      signature,
      walletType,
      acceptedDocumentIds
    );

    this.updateToken(result.accessToken);

    return {
      user: result.user,
      isAuthenticated: true,
      pendingDocuments: [],
    };
  }

  async getCurrentUser(): Promise<User> {
    return await this.authRepository.getCurrentUser();
  }

  async checkCompliance(): Promise<PendingDocument[]> {
    const result = await this.authRepository.checkCompliance();
    return result.missingDocuments;
  }

  async acceptPendingDocuments(documentIds: string[]): Promise<void> {
    await this.authRepository.acceptDocuments(documentIds);
  }

  logout(): void {
    this.storage.removeToken();
    this.authRepository.clearAuthToken();
    this.walletProvider.disconnect();
  }

  isAuthenticated(): boolean {
    return this.authRepository.hasAuthToken();
  }
}
