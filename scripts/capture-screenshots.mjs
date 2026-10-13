/**
 * Captures card-sized screenshots of the three live demos.
 *
 * Why this exists: the original screenshots were full-page captures
 * (1280 x ~6800). Cropping an 6800px-tall image down to a card thumbnail with
 * `object-fit: cover` samples a thin band, and for these pages that band is
 * mostly empty background \u2014 so the cards looked blank even though the files
 * were fine. A card needs a *viewport* shot at the card's own aspect ratio.
 *
 * Run once, from the project root:
 *   node scripts/capture-screenshots.mjs
 *
 * Re-run it whenever a project's UI changes, so the screenshots keep
 * representing the real product (PROJECT-PLAN.md section 5: "Real screenshots
 * (never fake mockups)").
 */

import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

// Resolve patchright from the CodeGPT extension that ships it, since it is not
// a dependency of this project (and should not become one \u2014 it is build-time
// tooling, not something the site needs to run).
const PATCHRIGHT_PATHS = [
  'C:/Users/NSSEC_FIN&ACCTS(HOD)/.vscode/extensions/danielsanmedium.dscodegpt-3.24.77/standalone/node_modules/patchright',
  'C:/Users/NSSEC_FIN&ACCTS(HOD)/.codegpt/standalone/node_modules/patchright',
]

let chromium
for (const candidate of PATCHRIGHT_PATHS) {
  try {
    ;({ chromium } = require(candidate))
    break
  } catch {
    // try the next candidate
  }
}

if (!chromium) {
  console.error('Could not resolve patchright. Looked in:')
  for (const p of PATCHRIGHT_PATHS) console.error('  ' + p)
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, '..', 'public', 'screenshots')

/**
 * Find the installed Chromium build.
 *
 * `chromium.launch()` defaults to the `chrome-headless-shell` download, which
 * is not present here — only the full `chromium-*` build is. Pointing at the
 * executable that actually exists avoids a download and works offline.
 *
 * The directory inside a `chromium-*` build is version-dependent: older
 * downloads unpack to `chrome-win`, newer ones to `chrome-win64`. Both are
 * checked, otherwise the lookup silently returns undefined and `launch()`
 * falls back to the missing headless-shell binary.
 */
const findChromium = () => {
  const root = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
  if (!existsSync(root)) return undefined

  const builds = readdirSync(root)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))

  for (const build of builds) {
    for (const dir of ['chrome-win64', 'chrome-win']) {
      const exe = path.join(root, build, dir, 'chrome.exe')
      if (existsSync(exe)) return exe
    }
  }

  return undefined
}

/**
 * 1200x900 is a 4:3 capture \u2014 the same ratio the card media box uses, so the
 * browser crops almost nothing and the card shows what was actually captured.
 */
const VIEWPORT = { width: 1200, height: 900 }

const TARGETS = [
  {
    file: 'pagebuilder.png',
    url: 'https://mustaphatijjaniharuna-max.github.io/Pagebuilder/',
    // Wait for the app to finish mounting rather than guessing at a delay.
    ready: 'body',
  },
  {
    file: 'craftfolio.png',
    url: 'https://mustaphatijjaniharuna-max.github.io/craftfolio/',
    ready: 'body',
  },
  {
    file: 'ideabox.png',
    url: 'https://mustaphatijjaniharuna-max.github.io/Idea-box/',
    ready: 'body',
  },
]

const run = async () => {
  await mkdir(outDir, { recursive: true })

  // Fail loudly rather than letting launch() reach for the headless-shell
  // download, which is not installed here. The message says what to do.
  const executablePath = findChromium()
  if (!executablePath) {
    console.error(
      'No Chromium build found under %LOCALAPPDATA%\\ms-playwright.\n' +
        'Install one with:  npx playwright install chromium',
    )
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // crisp on retina; the files stay well under 1MB
  })

  for (const target of TARGETS) {
    const page = await context.newPage()
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForSelector(target.ready, { timeout: 30000 })

      // Let fonts settle and any entry animation finish, otherwise the shot can
      // catch the page mid-transition.
      await page.evaluate(() => document.fonts?.ready)
      await page.waitForTimeout(1200)

      const file = path.join(outDir, target.file)
      await page.screenshot({ path: file, type: 'png' })

      console.log(`captured ${target.file}  <- ${target.url}`)
    } catch (error) {
      console.error(`FAILED ${target.file}: ${error.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})