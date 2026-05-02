import { useContext, useRef } from 'react'
import { CursorContext }     from '../context/CursorContext'
import { TransitionContext } from '../context/TransitionContext'

// ─────────────────────────────────────────────────────────────────
// NavLink
//
// A styled anchor that:
//   1. Signals cursor hover state (expands ring)
//   2. Triggers the global page transition before navigation
// ─────────────────────────────────────────────────────────────────

export default function NavLink({ href, children, className = '' }) {
  const { isHovering }                  = useContext(CursorContext)
  const { setIsTransitioning }          = useContext(TransitionContext)
  const transitionTimer                 = useRef()

  const handleMouseEnter = () => { isHovering.current = true }
  const handleMouseLeave = () => { isHovering.current = false }

  const handleClick = (e) => {
    e.preventDefault()
    if (transitionTimer.current) return   // debounce

    setIsTransitioning(true)

    // After the transition animation (~900ms), navigate
    transitionTimer.current = setTimeout(() => {
      // In a real Next.js app: router.push(href)
      window.location.href = href
    }, 900)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        textDecoration: 'none',
        display:        'inline-block',
        cursor:         'none',   // cursor is hidden globally
      }}
      className={className}
    >
      {children}
    </a>
  )
}
