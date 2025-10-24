import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaseApiClient } from '@/lib/infrastructure/api/base-api.client'
import { NetworkError, TimeoutError } from '@/lib/domain/errors/network.error'

describe('BaseApiClient', () => {
  let client: BaseApiClient
  
  beforeEach(() => {
    client = new BaseApiClient('http://test-api.com')
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const result = await client.get('/test')

      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith(
        'http://test-api.com/test',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should throw NetworkError on failed request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      })

      await expect(client.get('/notfound')).rejects.toThrow(NetworkError)
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' }
      const postData = { name: 'New Item' }
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const result = await client.post('/items', postData)

      expect(result).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith(
        'http://test-api.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      )
    })
  })

  describe('Retry logic', () => {
    it('should retry on network error', async () => {
      let attempts = 0
      
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Server error' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      })

      const result = await client.get('/test', { retries: 2, retryDelay: 10 })

      expect(result).toEqual({ success: true })
      expect(attempts).toBe(3)
    })

    it('should not retry on client errors (4xx)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
      })

      await expect(client.get('/test', { retries: 2 })).rejects.toThrow(NetworkError)
      expect(fetch).toHaveBeenCalledTimes(1) // No retries
    })
  })

  describe('Timeout handling', () => {
    it('should handle request timeout', async () => {
      // Mock AbortController behavior
      const mockAbort = vi.fn()
      global.AbortController = vi.fn().mockImplementation(() => ({
        signal: {},
        abort: mockAbort,
      })) as any

      global.fetch = vi.fn().mockImplementation(() => {
        // Simulate timeout by throwing abort error
        const error = new Error('The operation was aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      await expect(
        client.get('/slow', { timeout: 100 })
      ).rejects.toThrow(TimeoutError)
    })
  })
})
