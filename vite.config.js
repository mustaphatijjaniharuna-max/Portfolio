import { defineConfig } from 'vite'

// GitHub Pages serves this site from a subpath, not from the domain root:
//   https://mustaphatijjaniharuna-max.github.io/Portfolio/
// Vite needs to know that prefix so every asset URL it emits is correct.
// `base` is only applied for the production build so that `npm run dev`
// keeps working at http://localhost:5173/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Portfolio/' : '/',
  build: {
    outDir: 'dist',
    // Three.js is by far the largest dependency; split it out so the app shell
    // can be parsed and painted before the 3D payload arrives.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
}))