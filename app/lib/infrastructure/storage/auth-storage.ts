/**
 * Auth Storage Implementation (Adapter).
 * Handles JWT token persistence in localStorage.
 */
import { AUTH_CONFIG } from '@/config/constants';
import type { IStorage } from '@/lib/domain/interfaces/storage.interface';

class AuthStorage implements IStorage {
  private readonly tokenKey = AUTH_CONFIG.TOKEN_KEY;

  setToken(token: string): void {
    console.log('[AuthStorage] setToken called with:', token?.substring(0, 50) + '...');
    console.log('[AuthStorage] tokenKey:', this.tokenKey);
    console.log('[AuthStorage] window exists:', typeof window !== 'undefined');
    
    if (typeof window === 'undefined') {
      console.log('[AuthStorage] Window undefined, returning');
      return;
    }
    
    try {
      localStorage.setItem(this.tokenKey, token);
      console.log('[AuthStorage] Token saved successfully');
      console.log('[AuthStorage] Verification - token in localStorage:', localStorage.getItem(this.tokenKey)?.substring(0, 50) + '...');
    } catch (error) {
      console.error('[AuthStorage] Failed to save token:', error);
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to read token:', error);
      return null;
    }
  }

  removeToken(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}

export const authStorage = new AuthStorage();
