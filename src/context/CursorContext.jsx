// ─────────────────────────────────────────────────────────────────
// CursorContext
//
// Uses a ref (not state) for isHovering to avoid React re-renders
// in the cursor animation loop — the cursor reads this ref directly
// in its rAF loop without triggering any reconciliation.
// ─────────────────────────────────────────────────────────────────
import { createContext, useRef } from 'react'

export const CursorContext = createContext(null)

export function CursorProvider({ children }) {
  const isHovering = useRef(false)

  return (
    <CursorContext.Provider value={{ isHovering }}>
      {children}
    </CursorContext.Provider>
  )
}
