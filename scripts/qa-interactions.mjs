/**
 * Drives the page the way a visitor would: opens a project's detail panel,
 * checks the nav toggle, and confirms the contact links are real.
 *
 * This is QA tooling, not part of the site — it lives in scripts/ so it is not
 * pulled into the bundle.
 *
 * Needs a server running the build (see scripts/qa-static-server.mjs, which
 * serves dist/ the way Pages does — do NOT use `vite preview`, it answers every
 * asset request with index.html and makes the build look broken):
 *
 *   npm run build
 *   node scripts/qa-static-server.mjs
 *   node <skill-dir>/browser.mjs http://localhost:4300/Portfolio/ \
 *     --wait ".card" --script ./scripts/qa-interactions.mjs
 */
export default async function run(page, ui) {
  const result = {}

  /* ---- keyboard: the skip link must be the first tab stop ----------------
   * Checked FIRST, on a pristine page. The original version of this script did
   * it after clicking the detail toggle and resizing the viewport, by which
   * point focus had already moved — so it reported the hero button as the first
   * stop, which is a bug in the test, not the page. */
  await page.keyboard.press('Tab')
  result.firstTabStop = await page.evaluate(() => {
    const el = document.activeElement
    return el ? `${el.tagName}.${String(el.className).split(' ')[0]}` : null
  })

  // The link is revealed by a 0.18s transform transition. Sample after it has
  // settled, or the first frame still reads as translated off-screen.
  result.skipLinkRevealedOnFocus = await page.evaluate(async () => {
    const el = document.querySelector('.skip-link')
    if (!el) return null
    el.focus()
    await new Promise((r) => setTimeout(r, 400))
    return Math.round(el.getBoundingClientRect().top) === 0
  })

  /* ---- detail panel: open the first card's details ---------------------- */
  const firstToggle = page.locator('.card__toggle').first()
  result.detailStartsHidden = await page.locator('.card__detail').first().isHidden()

  await firstToggle.click()
  await page.waitForTimeout(300)

  result.detailOpensOnClick = await page.locator('.card__detail').first().isVisible()
  result.ariaExpandedAfterOpen = await firstToggle.getAttribute('aria-expanded')
  result.toggleLabelAfterOpen = (await firstToggle.innerText()).trim()
  result.detailRowCount = await page.locator('.card').first().locator('.detail__row').count()

  await firstToggle.click()
  await page.waitForTimeout(300)
  result.detailClosesAgain = await page.locator('.card__detail').first().isHidden()
  result.ariaExpandedAfterClose = await firstToggle.getAttribute('aria-expanded')

  /* ---- screenshots actually decoded --------------------------------------
   * An <img> can exist and be "complete" while showing nothing, so assert on
   * naturalWidth — the one signal that the file really loaded. */
  result.screenshotsLoaded = await page.evaluate(() =>
    [...document.querySelectorAll('.card__shot')].map((img) => ({
      file: img.currentSrc.split('/').pop(),
      decoded: img.naturalWidth > 0,
      size: `${img.naturalWidth}x${img.naturalHeight}`,
    })),
  )

  /* ---- contact links are real, not placeholders ------------------------- */
  result.emailHref = await page.locator('[data-contact="email"]').getAttribute('href')
  result.githubHref = await page.locator('.contact__card').nth(1).getAttribute('href')

  /* ---- project demo links ---------------------------------------------- */
  result.demoLinks = await page.locator('.card__actions a[target="_blank"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('href')),
  )

  /* ---- mobile menu ------------------------------------------------------ */
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(200)

  const toggle = page.locator('.nav__toggle')
  result.menuToggleVisibleOnMobile = await toggle.isVisible()
  result.menuHiddenInitially = await page.locator('#nav-menu').isHidden()

  await toggle.click()
  await page.waitForTimeout(250)
  result.menuOpensOnMobile = await page.locator('#nav-menu').isVisible()
  result.bodyScrollLocked = await page.evaluate(() =>
    document.body.classList.contains('is-menu-open'),
  )

  // Escape should close it and return focus to the button.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  result.menuClosesOnEscape = await page.locator('#nav-menu').isHidden()
  result.focusReturnedToToggle = await page.evaluate(() =>
    document.activeElement?.classList.contains('nav__toggle'),
  )

  /* ---- no horizontal overflow at mobile width --------------------------- */
  result.horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )

  return result
}