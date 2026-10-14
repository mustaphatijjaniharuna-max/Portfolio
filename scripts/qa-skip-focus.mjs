/**
 * Narrow probe for one question: does the skip link actually appear when it is
 * focused, and is the reason it did not in the earlier run the page or the
 * driver?
 *
 * It records the transform and the computed box both *after a real Tab* and
 * after an explicit `.focus()`, so a missing `:focus` rule (nothing moves
 * either way) is distinguishable from a driver quirk (Tab does nothing,
 * `.focus()` works).
 *
 *   npm run build
 *   node scripts/qa-static-server.mjs
 *   node <skill-dir>/browser.mjs http://localhost:4300/Portfolio/ \
 *     --wait ".card" --script ./scripts/qa-skip-focus.mjs
 */
export default async function run(page) {
  await page.waitForSelector('.card', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(500)

  await page.keyboard.press('Tab')

  return await page.evaluate(async () => {
    const el = document.querySelector('.skip-link')

    const read = (label) => {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        label,
        transform: cs.transform,
        top: Math.round(rect.top),
        isFocused: document.activeElement === el,
        matchesFocus: el.matches(':focus'),
      }
    }

    const before = read('after first Tab')

    // The transition is 0.18s and is only started by focus landing, which can
    // happen a frame or two after the Tab keypress returns. A reading taken
    // immediately therefore catches the transform mid-flight and looks like the
    // link never moved. Wait for it to settle before judging.
    await new Promise((r) => setTimeout(r, 400))
    const settled = read('after first Tab + 400ms')

    el.focus()
    await new Promise((r) => setTimeout(r, 400))

    const after = read('after explicit .focus() + 400ms')

    return { before, settled, after, revealedOnTab: settled.top === 0 }
  })
}