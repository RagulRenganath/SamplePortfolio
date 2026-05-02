import { useRef, useEffect, useContext } from 'react'
import { gsap } from 'gsap'
import { TransitionContext } from '../context/TransitionContext'

// ─────────────────────────────────────────────────────────────────
// PageTransition
//
// A full-screen overlay that animates in when `isTransitioning` is
// true. It uses two stacked rectangles so the wipe feels
// like a liquid curtain draw rather than a simple fade:
//
//   ┌──────────────┐
//   │  foreground  │  ← solid black, wipes in first (slight delay)
//   │  background  │  ← dark grey, wipes in slightly ahead
//   └──────────────┘
//
// The "wipe" is a scaleX from 0→1 on a full-screen div using
// transform-origin: left center.
// ─────────────────────────────────────────────────────────────────

export default function PageTransition() {
  const { isTransitioning } = useContext(TransitionContext)
  const bgRef   = useRef()
  const fgRef   = useRef()
  const tlRef   = useRef()

  useEffect(() => {
    const bg = bgRef.current
    const fg = fgRef.current
    if (!bg || !fg) return

    // Ensure starting state
    gsap.set([bg, fg], { scaleX: 0, transformOrigin: 'left center' })
  }, [])

  useEffect(() => {
    if (!isTransitioning) return

    const bg = bgRef.current
    const fg = fgRef.current

    // Kill any running timeline
    tlRef.current?.kill()

    const tl = gsap.timeline()
    tlRef.current = tl

    // Wipe IN: background first, foreground follows
    tl.to(bg, {
      scaleX:   1,
      duration: 0.65,
      ease:     'power4.inOut',
    })
    .to(fg, {
      scaleX:   1,
      duration: 0.55,
      ease:     'power4.inOut',
    }, '-=0.45')
    // Hold briefly so WebGL has time to prep the new scene
    .to({}, { duration: 0.15 })
    // Wipe OUT from the right side — foreground first
    .set([bg, fg], { transformOrigin: 'right center' })
    .to(fg, {
      scaleX:   0,
      duration: 0.5,
      ease:     'power4.inOut',
    })
    .to(bg, {
      scaleX:   0,
      duration: 0.6,
      ease:     'power4.inOut',
    }, '-=0.35')
  }, [isTransitioning])

  return (
    <div
      style={{
        position: 'fixed',
        inset:    0,
        zIndex:   100,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Background wipe — dark cool grey */}
      <div
        ref={bgRef}
        style={{
          position:  'absolute',
          inset:     0,
          background:'#0d0e12',
          transform: 'scaleX(0)',
        }}
      />
      {/* Foreground wipe — true black */}
      <div
        ref={fgRef}
        style={{
          position:  'absolute',
          inset:     0,
          background:'#000000',
          transform: 'scaleX(0)',
        }}
      />
    </div>
  )
}
