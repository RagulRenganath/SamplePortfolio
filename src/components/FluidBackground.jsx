import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader   from '../shaders/fluid.vert?raw'
import fragmentShader from '../shaders/fluid.frag?raw'

// ─────────────────────────────────────────────────────────────────
// FluidBackground
//
// A full-screen shader plane mounted in front of the camera.
// The mesh is parented to the camera so it always covers the
// viewport regardless of camera transforms.
//
// Uniform update strategy:
//   - uTime      → incremented in useFrame (cheap, per-frame)
//   - uMouse     → lerped toward raw mouse each frame (smooth lag)
//   - uMouseVel  → exponential decay of mouse speed
//   - uDistort   → driven from outside (page transition state)
//   - uResolution→ set on mount + resize
// ─────────────────────────────────────────────────────────────────

const LERP_FACTOR    = 0.06   // cursor smoothness (lower = more lag)
const VELOCITY_DECAY = 0.92   // how fast velocity fades

export default function FluidBackground({ mouse, isTransitioning }) {
  const meshRef   = useRef()
  const { gl, camera, size } = useThree()

  // ── Shader Material (memoized — never reconstructed) ──────────
  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uMouse:      { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uDistort:    { value: 0 },
    uMouseVel:   { value: 0 },
  }), []) // eslint-disable-line

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthWrite: false,
    depthTest:  false,
    extensions: { derivatives: true },  // for dFdx/dFdy in frag
  }), [uniforms])

  // ── Resize handler ─────────────────────────────────────────────
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
  }, [size, uniforms])

  // ── Transition distort driver ──────────────────────────────────
  const distortTarget = useRef(0)
  useEffect(() => {
    distortTarget.current = isTransitioning ? 1.0 : 0.0
  }, [isTransitioning])

  // ── Internal lerp state (avoids React re-renders) ─────────────
  const smoothMouse = useRef({ x: 0, y: 0 })
  const prevMouse   = useRef({ x: 0, y: 0 })

  // ── useFrame — the hot loop ────────────────────────────────────
  useFrame((_, delta) => {
    const u = uniforms

    // Time — clamp delta so a tab-switch doesn't spike it
    u.uTime.value += Math.min(delta, 0.05)

    // Mouse lerp
    const sm = smoothMouse.current
    const rm = mouse.current
    sm.x += (rm.x - sm.x) * LERP_FACTOR
    sm.y += (rm.y - sm.y) * LERP_FACTOR
    u.uMouse.value.set(sm.x, sm.y)

    // Mouse velocity (magnitude of delta per frame)
    const dx = sm.x - prevMouse.current.x
    const dy = sm.y - prevMouse.current.y
    const vel = Math.sqrt(dx * dx + dy * dy) * 60  // normalise to ~60fps
    u.uMouseVel.value = u.uMouseVel.value * VELOCITY_DECAY + vel * (1 - VELOCITY_DECAY)
    prevMouse.current.x = sm.x
    prevMouse.current.y = sm.y

    // Distort lerp
    u.uDistort.value += (distortTarget.current - u.uDistort.value) * 0.04
  })

  // ── Geometry: plane sized to cover FOV at z=0 ─────────────────
  // We calculate the exact plane size from camera FOV so it's pixel-perfect
  const planeSize = useMemo(() => {
    const fov    = camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * Math.abs(camera.position.z)
    const width  = height * (size.width / size.height)
    return [width * 1.1, height * 1.1]  // 10% bleed to cover rounding errors
  }, [camera, size])

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      frustumCulled={false}   // never skip this mesh
    >
      <planeGeometry args={[planeSize[0], planeSize[1], 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
