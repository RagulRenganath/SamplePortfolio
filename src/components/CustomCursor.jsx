import { useRef, useEffect, useContext } from 'react'
import { CursorContext } from '../context/CursorContext'

// ─────────────────────────────────────────────────────────────────
// CustomCursor
//
// Two-element cursor:
//   • dot     — snaps directly to mouse (no lag)
//   • ring    — lerps toward mouse (smooth trail)
//
// State changes:
//   • hovering interactive element → ring expands, colour shifts
//   • link hover                   → ring becomes an X-hair
//   • during transition            → both fade out
//
// All animation is in JS/CSS transforms — no layout thrashing.
// ─────────────────────────────────────────────────────────────────

const DOT_SIZE  = 6
const RING_SIZE = 36
const RING_HOVER_SIZE = 60
const LERP      = 0.14

export default function CustomCursor() {
  const dotRef  = useRef()
  const ringRef = useRef()
  const pos     = useRef({ mx: -100, my: -100, rx: -100, ry: -100 })
  const { isHovering } = useContext(CursorContext)
  const rafId   = useRef()

  useEffect(() => {
    // Hide the system cursor globally
    document.documentElement.style.cursor = 'none'
    return () => { document.documentElement.style.cursor = '' }
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      pos.current.mx = e.clientX
      pos.current.my = e.clientY
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const tick = () => {
      const p = pos.current

      // Dot: direct snap
      dot.style.transform = `translate(${p.mx - DOT_SIZE / 2}px, ${p.my - DOT_SIZE / 2}px)`

      // Ring: lerp
      p.rx += (p.mx - p.rx) * LERP
      p.ry += (p.my - p.ry) * LERP
      const rSize = isHovering.current ? RING_HOVER_SIZE : RING_SIZE
      ring.style.transform = `translate(${p.rx - rSize / 2}px, ${p.ry - rSize / 2}px)`

      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [isHovering])

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         DOT_SIZE,
          height:        DOT_SIZE,
          borderRadius:  '50%',
          background:    '#e8e8e0',
          pointerEvents: 'none',
          zIndex:        9999,
          willChange:    'transform',
          mixBlendMode:  'difference',
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         RING_SIZE,
          height:        RING_SIZE,
          borderRadius:  '50%',
          border:        '1px solid rgba(232, 232, 224, 0.55)',
          pointerEvents: 'none',
          zIndex:        9998,
          willChange:    'transform, width, height',
          transition:    'width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
          mixBlendMode:  'difference',
        }}
      />
    </>
  )
}
