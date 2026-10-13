import * as THREE from 'three'

/**
 * The hero 3D scene: a slowly drifting cluster of wireframe geometry behind the
 * page, with a camera that leans toward the cursor.
 *
 * Design constraints this file deliberately obeys (PROJECT-PLAN.md sections
 * 12, 13, 15):
 *
 *  - It is decoration. Everything it shows is reachable in the normal page
 *    sections, so if it never loads nothing is lost. The canvas is
 *    `aria-hidden` in index.html and never takes focus.
 *  - Nothing here is required for the page to work. Every failure path ends in
 *    a static CSS fallback rather than an error.
 *  - `prefers-reduced-motion` gets the static fallback: the scene is pure
 *    motion with no content value, so honouring the setting costs nothing.
 *  - No post-processing, no shadows, no textures, no model files. A handful of
 *    LineSegments draw calls and a couple of points. It has to survive a phone.
 */

const ACCENT = 0x4d8dff
const ACCENT_SOFT = 0x8fb6ff

/** Cap the pixel ratio: a 3x phone screen quadruples the fill cost for no
 *  visible gain on thin wireframes. */
const MAX_PIXEL_RATIO = 2

/** How far the camera leans toward the cursor, in world units. Small on
 *  purpose \u2014 this should be a hint of depth, not a rollercoaster. */
const PARALLAX = 1.15

export function initScene() {
  const canvas = document.getElementById('scene')
  const fallback = document.getElementById('scene-fallback')
  if (!canvas) return () => {}

  const showFallback = () => {
    canvas.hidden = true
    if (fallback) fallback.hidden = false
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (reducedMotion.matches) {
    showFallback()
    return () => {}
  }

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
  } catch (error) {
    // No WebGL, a blocked context, a driver that lies about its capabilities.
    console.warn('[scene] WebGL unavailable, using the static fallback.', error)
    showFallback()
    return () => {}
  }

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / Math.max(window.innerHeight, 1),
    0.1,
    120,
  )
  camera.position.set(0, 0, 14)

  /* ------------------------------------------------------------- the cluster */

  const cluster = new THREE.Group()
  scene.add(cluster)

  // One shared geometry per primitive, reused across meshes. Rebuilding a
  // sphere per object would be wasteful for shapes that are identical.
  const geometries = {
    icosa: new THREE.IcosahedronGeometry(1, 0),
    octa: new THREE.OctahedronGeometry(1, 0),
    box: new THREE.BoxGeometry(1.1, 1.1, 1.1),
    torus: new THREE.TorusGeometry(0.85, 0.28, 8, 20),
  }

  const materials = [
    new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.85 }),
    new THREE.LineBasicMaterial({ color: ACCENT_SOFT, transparent: true, opacity: 0.5 }),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }),
  ]

  // Hand-placed rather than randomised: a random scatter looked like debris,
  // and the composition needs to stay clear of the headline on the left.
  const layout = [
    { geo: 'icosa', pos: [3.4, 1.5, -2.0], scale: 2.3, spin: [0.09, 0.14, 0.03], mat: 0 },
    { geo: 'octa', pos: [5.6, -1.9, -3.4], scale: 1.5, spin: [0.15, -0.11, 0.05], mat: 1 },
    { geo: 'torus', pos: [1.9, -2.6, -1.1], scale: 1.25, spin: [0.07, 0.19, 0.1], mat: 1 },
    { geo: 'box', pos: [6.6, 2.4, -5.2], scale: 1.1, spin: [0.12, 0.08, -0.06], mat: 2 },
    { geo: 'icosa', pos: [0.6, 3.3, -4.6], scale: 1.0, spin: [0.1, -0.16, 0.04], mat: 2 },
    { geo: 'octa', pos: [-3.1, 2.9, -6.0], scale: 0.9, spin: [0.13, 0.12, 0.08], mat: 2 },
    { geo: 'box', pos: [-4.4, -2.2, -5.6], scale: 0.8, spin: [0.08, -0.09, 0.11], mat: 2 },
  ]

  const shapes = layout.map((spec) => {
    const mesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometries[spec.geo]),
      materials[spec.mat],
    )
    mesh.position.set(...spec.pos)
    mesh.scale.setScalar(spec.scale)
    mesh.userData.spin = spec.spin
    cluster.add(mesh)
    return mesh
  })

  /* --------------------------------------------------------------- particles */

  // A sparse starfield gives the wireframes something to sit in front of.
  // 240 points in one BufferGeometry is a single draw call.
  const COUNT = 240
  const positions = new Float32Array(COUNT * 3)

  for (let i = 0; i < COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 34
    positions[i * 3 + 1] = (Math.random() - 0.5) * 22
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 6
  }

  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: ACCENT_SOFT,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  )
  scene.add(stars)

  /* ------------------------------------------------------------------- size */

  const resize = () => {
    const width = window.innerWidth
    const height = Math.max(window.innerHeight, 1)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
    renderer.setSize(width, height, false)

    camera.aspect = width / height

    // On a narrow screen the interesting geometry sits off to the right, where
    // there is no room for it. Pull the camera back so the composition still
    // reads on a phone instead of cropping to a stray corner.
    camera.position.z = width < 820 ? 22 : 14

    camera.updateProjectionMatrix()
  }

  resize()

  /* --------------------------------------------------------------- pointer */

  // Target vs. current: the camera eases toward the target each frame, which is
  // what makes the movement feel smooth rather than twitchy.
  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }

  const onPointerMove = (event) => {
    target.x = (event.clientX / window.innerWidth) * 2 - 1
    target.y = (event.clientY / window.innerHeight) * 2 - 1
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })

  /* ------------------------------------------------------------------ loop */

  const clock = new THREE.Clock()
  let frame = 0
  let running = true

  const render = () => {
    frame = requestAnimationFrame(render)
    if (!running) return

    const elapsed = clock.getElapsedTime()

    // Ease toward the pointer. 0.045 is slow enough to feel like weight.
    pointer.x += (target.x - pointer.x) * 0.045
    pointer.y += (target.y - pointer.y) * 0.045

    camera.position.x = pointer.x * PARALLAX
    camera.position.y = -pointer.y * PARALLAX * 0.6
    camera.lookAt(0, 0, 0)

    for (const shape of shapes) {
      const [sx, sy, sz] = shape.userData.spin
      shape.rotation.x += sx * 0.004
      shape.rotation.y += sy * 0.004
      shape.rotation.z += sz * 0.004
    }

    cluster.rotation.y = Math.sin(elapsed * 0.08) * 0.12
    stars.rotation.y = elapsed * 0.008

    renderer.render(scene, camera)
  }

  // Don't burn battery animating a tab nobody is looking at.
  const onVisibility = () => {
    running = !document.hidden
    if (running) clock.getDelta()
  }

  document.addEventListener('visibilitychange', onVisibility)

  const onResize = () => resize()
  window.addEventListener('resize', onResize)

  render()

  /* -------------------------------------------------------------- teardown */

  return () => {
    cancelAnimationFrame(frame)
    running = false

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)

    for (const geometry of Object.values(geometries)) geometry.dispose()
    starGeometry.dispose()
    for (const material of materials) material.dispose()
    stars.material.dispose()
    renderer.dispose()
  }
}