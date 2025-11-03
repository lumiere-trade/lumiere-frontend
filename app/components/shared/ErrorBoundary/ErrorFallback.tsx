'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { ApiError, TimeoutError } from '@/lib/api/client'

interface ErrorFallbackProps {
  error: Error
  onReset?: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isApiError = error instanceof ApiError
  const isTimeoutError = error instanceof TimeoutError
  
  let userMessage = 'Something went wrong. Please try again.'
  let errorCode: string | undefined
  
  if (isApiError) {
    userMessage = error.message
    errorCode = error.code
  } else if (isTimeoutError) {
    userMessage = 'Request timed out. Please check your connection and try again.'
  }

  const handleReload = () => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-red-500/20 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {error.name}
          </h2>

          <p className="text-gray-400 mb-6">
            {userMessage}
          </p>

          {errorCode && (
            <p className="text-sm text-gray-500 mb-6">
              Error Code: {errorCode}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleReload}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                Technical Details
              </summary>
              <div className="mt-2 p-4 bg-black/50 rounded border border-gray-800">
                <p className="text-xs text-red-400 font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
