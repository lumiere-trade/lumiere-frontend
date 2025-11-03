/**
 * Local Storage Utilities
 * Browser-only token persistence
 */

const TOKEN_KEY = 'lumiere_auth_token'

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to save token:', error)
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to read token:', error)
    return null
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove token:', error)
  }
}

export function hasToken(): boolean {
  return getToken() !== null
}
