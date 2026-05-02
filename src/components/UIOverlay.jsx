import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import MaskedText from './MaskedText'
import NavLink from './NavLink'

// ─────────────────────────────────────────────────────────────────
// UIOverlay
//
// Sits above the canvas (pointer-events: none on wrapper).
// Individual interactive elements re-enable pointer-events.
//
// Typography hierarchy:
//   • eyebrow   — 11px spaced uppercase tracking
//   • headline  — massive display (clamp 80px..160px)
//   • subline   — medium weight descriptor
//   • body      — readable paragraph weight
// ─────────────────────────────────────────────────────────────────

export default function UIOverlay() {
  const overlayRef = useRef()

  useEffect(() => {
    // Staggered page-enter timeline
    const ctx = gsap.context(() => {
      gsap.from('.nav-item', {
        y: -24,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.3,
      })
      gsap.from('.hero-meta', {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        delay: 1.8,
      })
    }, overlayRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        10,
        pointerEvents: 'none',  // ← canvas stays interactive underneath
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav
        style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          padding:       '32px 48px',
          pointerEvents: 'none',
        }}
      >
        <div className="nav-item" style={{ pointerEvents: 'auto' }}>
          <NavLink href="/">
            <span style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '13px',
              fontWeight:    700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         'rgba(232,232,224,0.9)',
            }}>
              STUDIO
            </span>
          </NavLink>
        </div>

        <div style={{ display: 'flex', gap: '40px', pointerEvents: 'auto' }}>
          {['Work', 'About', 'Contact'].map((label) => (
            <div key={label} className="nav-item">
              <NavLink href={`/${label.toLowerCase()}`}>
                <span style={{
                  fontFamily:    'var(--font-body)',
                  fontSize:      '12px',
                  fontWeight:    400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'rgba(232,232,224,0.55)',
                  transition:    'color 0.3s ease',
                }}>
                  {label}
                </span>
              </NavLink>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Hero block ─────────────────────────────────────────── */}
      <div
        style={{
          flex:    1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 48px 80px',
        }}
      >
        {/* Eyebrow */}
        <MaskedText delay={0.6} duration={0.8}>
          <span style={{
            fontFamily:    'var(--font-body)',
            fontSize:      '11px',
            fontWeight:    500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color:         'rgba(232,232,224,0.45)',
            display:       'block',
            marginBottom:  '20px',
          }}>
            Creative Technology Studio — Est. 2024
          </span>
        </MaskedText>

        {/* Main headline — brutalist, enormous */}
        <MaskedText delay={0.85} duration={1.1} yOffset={80}>
          <h1 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(72px, 10vw, 148px)',
            fontWeight:    900,
            lineHeight:    0.92,
            letterSpacing: '-0.03em',
            color:         'rgba(232,232,224,0.95)',
            margin:        0,
            maxWidth:      '14ch',
          }}>
            WE BUILD<br />IMPOSSIBLE<br />THINGS.
          </h1>
        </MaskedText>

        {/* Subline */}
        <MaskedText delay={1.2} duration={0.9} yOffset={40}>
          <p style={{
            fontFamily:    'var(--font-body)',
            fontSize:      'clamp(14px, 1.5vw, 18px)',
            fontWeight:    300,
            letterSpacing: '0.02em',
            color:         'rgba(232,232,224,0.45)',
            margin:        '28px 0 0',
            maxWidth:      '42ch',
            lineHeight:    1.6,
          }}>
            Immersive digital experiences at the intersection
            of craft, technology, and obsessive detail.
          </p>
        </MaskedText>
      </div>

      {/* ── Footer meta strip ──────────────────────────────────── */}
      <div
        className="hero-meta"
        style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          padding:       '24px 48px',
          borderTop:     '1px solid rgba(232,232,224,0.08)',
          pointerEvents: 'auto',
        }}
      >
        <span style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color:         'rgba(232,232,224,0.3)',
        }}>
          © 2024 Studio
        </span>
        <span style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color:         'rgba(232,232,224,0.3)',
        }}>
          47.606° N, 122.332° W
        </span>
        <NavLink href="/reel">
          <span style={{
            fontFamily:    'var(--font-body)',
            fontSize:      '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'rgba(232,232,224,0.55)',
          }}>
            View Reel ↗
          </span>
        </NavLink>
      </div>
    </div>
  )
}
