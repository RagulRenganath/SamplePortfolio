import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import FluidBackground from './components/FluidBackground'
import CustomCursor from './components/CustomCursor'
import UIOverlay from './components/UIOverlay'
import PageTransition from './components/PageTransition'
import { CursorProvider } from './context/CursorContext'
import { TransitionProvider } from './context/TransitionContext'
import './styles/globals.css'

export default function App() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mouse = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.px = mouse.current.x
      mouse.current.py = mouse.current.y
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <TransitionProvider value={{ isTransitioning, setIsTransitioning }}>
      <CursorProvider>
        <div className="app-root">

          {/* ─── LAYER 0: Custom Cursor (DOM, above everything) ─── */}
          <CustomCursor />

          {/* ─── LAYER 1: WebGL Canvas Background ─── */}
          <div className="canvas-wrapper" aria-hidden="true">
            <Canvas
              dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
              camera={{ position: [0, 0, 1], fov: 45, near: 0.01, far: 100 }}
              gl={{
                antialias: false,
                powerPreference: 'high-performance',
                alpha: false,
                stencil: false,
                depth: false,
              }}
            >
              <FluidBackground mouse={mouse} isTransitioning={isTransitioning} />
            </Canvas>
          </div>

          {/* ─── LAYER 2: DOM UI Overlay ─── */}
          <UIOverlay />

          {/* ─── LAYER 3: Page Transition Overlay ─── */}
          <PageTransition />
        </div>
      </CursorProvider>
    </TransitionProvider>
  )
}
