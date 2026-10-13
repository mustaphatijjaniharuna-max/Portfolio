/**
 * Serves the production build the way GitHub Pages will, for QA only.
 *
 * Why this exists: `vite preview` cannot be trusted here. It answers *every*
 * request with `index.html` — including `/Portfolio/assets/*.js`, `*.css` and
 * `screenshots/*.png`, and including paths that do not exist. A build checked
 * through it looks broken (the app shell mounts, the main bundle "404s", and
 * `#projects` renders nothing) when `dist/` is in fact fine. That cost a full
 * round of debugging; this script is so it does not cost another.
 *
 * It mounts `dist/` under the `/Portfolio/` prefix, exactly as Pages does, and
 * returns a real 404 for anything missing. Correct Content-Types matter: a
 * `.js` served as `text/html` is rejected by the browser's module loader, which
 * is precisely the failure mode that looks like a broken bundle.
 *
 *   node scripts/qa-static-server.mjs
 *   # then: http://localhost:4300/Portfolio/
 *
 * Build first (`npm run build`), or it will serve a stale or missing `dist/`.
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', 'dist')
const PORT = 4300

const TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

if (!fs.existsSync(root)) {
  console.error(`No build found at ${root}. Run: npm run build`)
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])

  // Strip the /Portfolio/ mount prefix, then refuse anything that tries to
  // climb back out of dist/ via `..`.
  const rel = url.replace(/^\/Portfolio\/?/, '')
  const file = path.resolve(root, rel)

  if (!file.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('403')
    return
  }

  const target =
    rel === '' || rel.endsWith('/') ? path.join(file, 'index.html') : file

  fs.readFile(target, (error, data) => {
    if (error) {
      // A real 404, so a missing asset is visible instead of being masked by
      // an HTML fallback.
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(`404 ${target}`)
      return
    }

    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log(`serving dist/ at http://localhost:${PORT}/Portfolio/`)
})