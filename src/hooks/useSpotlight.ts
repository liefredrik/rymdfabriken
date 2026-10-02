import { useCallback } from 'react'
import type { MouseEvent } from 'react'

/** Feeds cursor position into --mx / --my for the `spotlight-card` utility. */
export function useSpotlight() {
  return useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }, [])
}
