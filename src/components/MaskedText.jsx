import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

// ─────────────────────────────────────────────────────────────────
// MaskedText
//
// Wraps children in an `overflow: hidden` mask container.
// On mount, the inner content is pushed DOWN by `yOffset` and
// clipped. GSAP animates it back to y=0, revealing it through
// the mask — the classic editorial "text slides up from behind
// an invisible wall" effect.
//
// Props:
//   delay    — seconds before animation starts
//   duration — animation duration in seconds
//   yOffset  — how far below the mask the text starts (px)
//   ease     — GSAP ease string
// ─────────────────────────────────────────────────────────────────

export default function MaskedText({
  children,
  delay    = 0,
  duration = 1.0,
  yOffset  = 56,
  ease     = 'cubic-bezier(0.16, 1, 0.3, 1)',
}) {
  const outerRef = useRef()
  const innerRef = useRef()

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    // Set initial state
    gsap.set(inner, { y: yOffset, opacity: 0 })

    const tween = gsap.to(inner, {
      y:        0,
      opacity:  1,
      duration,
      delay,
      ease,
      clearProps: 'transform,opacity',  // clean up after animation completes
    })

    return () => tween.kill()
  }, [delay, duration, yOffset, ease])

  return (
    <div
      ref={outerRef}
      style={{ overflow: 'hidden', display: 'block' }}
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  )
}
