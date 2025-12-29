import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    
    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
    // Fallback for older browsers
    else {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [matches, query])

  return matches
}

// Preset breakpoints
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1920px)')
export const useIsMediumScreen = () => useMediaQuery('(min-width: 1440px) and (max-width: 1919px)')
export const useIsSmallScreen = () => useMediaQuery('(max-width: 1439px)')
