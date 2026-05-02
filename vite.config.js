import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl  from 'vite-plugin-glsl'

// ─────────────────────────────────────────────────────────────────
// vite.config.js
//
// vite-plugin-glsl lets us import .vert/.frag files as raw strings:
//   import vertexShader from './shaders/fluid.vert?raw'
//   — or without ?raw if the plugin is configured to handle it —
//
// Both ?raw imports (Vite native) and glsl plugin transforms work.
// The plugin also supports #include directives for shader modules.
// ─────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    glsl({
      include:    ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs'],
      exclude:    undefined,
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      compress:   false,    // keep shaders readable in dev
      watch:      true,
      root:       '/',
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Split Three.js into its own chunk for better caching
        manualChunks: {
          three:   ['three'],
          r3f:     ['@react-three/fiber', '@react-three/drei'],
          gsap:    ['gsap'],
        },
      },
    },
  },
})
