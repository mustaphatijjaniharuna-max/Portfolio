import './styles/main.css'

import { renderProjects } from './projects.js'
import { initNav, renderContact } from './nav.js'

/**
 * Entry point.
 *
 * Order matters a little: the content is rendered first so the page is complete
 * and usable, then the 3D is started. If the scene fails, everything above it
 * is already on screen.
 *
 * The scene is also loaded lazily \u2014 three.js is by far the heaviest dependency,
 * and there is no reason to make a visitor on a slow connection wait for the
 * WebGL bundle before they can read the page.
 */

renderContact()
renderProjects()
initNav()

const canvas = document.getElementById('scene')
const fallback = document.getElementById('scene-fallback')

// Nothing to do if the canvas is not on this page.
if (canvas) {
  const startScene = async () => {
    try {
      const { initScene } = await import('./scene.js')
      initScene()
    } catch (error) {
      // A failed chunk load or an unexpected error in the scene must never take
      // the page down with it. Show the static backdrop and carry on.
      console.warn('[scene] failed to start, using the static fallback.', error)
      canvas.hidden = true
      if (fallback) fallback.hidden = false
    }
  }

  // `requestIdleCallback` is not in Safari, hence the timeout fallback.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startScene, { timeout: 2000 })
  } else {
    window.setTimeout(startScene, 200)
  }
}

// A hero hint that tells the visitor to move the cursor is misleading on a
// touch device, and noisy for someone who cannot see the scene anyway.
const heroHint = document.querySelector('.hero__hint')
if (heroHint && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  heroHint.remove()
}