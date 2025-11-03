/**
 * useLogger Hook
 * React hook for component logging with automatic lifecycle tracking
 */
import { useEffect, useRef } from 'react'
import { logger, LogCategory } from '@/lib/debug'

export function useLogger(componentName: string, category: LogCategory = LogCategory.COMPONENT) {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    logger.debug(category, `${componentName} mounted`)

    return () => {
      logger.debug(category, `${componentName} unmounted`)
    }
  }, [componentName, category])

  return {
    log: (message: string, data?: any) =>
      logger.debug(category, `[${componentName}] ${message}`, data),
    debug: (message: string, data?: any) =>
      logger.debug(category, `[${componentName}] ${message}`, data),
    info: (message: string, data?: any) =>
      logger.info(category, `[${componentName}] ${message}`, data),
    warn: (message: string, data?: any) =>
      logger.warn(category, `[${componentName}] ${message}`, data),
    error: (message: string, data?: any) =>
      logger.error(category, `[${componentName}] ${message}`, data),
    group: (title: string) =>
      logger.group(category, `[${componentName}] ${title}`),
    groupEnd: () =>
      logger.groupEnd(),
    time: (label: string) =>
      logger.time(category, `[${componentName}] ${label}`),
    timeEnd: (label: string) =>
      logger.timeEnd(category, `[${componentName}] ${label}`),
  }
}
