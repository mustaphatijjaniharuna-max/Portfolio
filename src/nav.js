import { site } from './data.js'

/**
 * Navigation behaviour: mobile menu, scroll state, active section, footer year.
 *
 * The menu is a plain show/hide rather than a focus trap. It sits inline in the
 * document (not in a portal or an overlay that covers the page), so tabbing out
 * of it simply continues into the page content, which is the behaviour a
 * keyboard user expects.
 */

const DESKTOP_QUERY = '(min-width: 820px)'

export function initNav() {
  const header = document.querySelector('.site-header')
  const toggle = document.querySelector('.nav__toggle')
  const menu = document.getElementById('nav-menu')
  if (!header || !toggle || !menu) return

  /* ---------------------------------------------------------------- menu -- */

  const setMenuOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    menu.classList.toggle('is-open', open)
    // Lock the page behind the open menu so a scroll gesture inside it does not
    // scroll the document underneath.
    document.body.classList.toggle('is-menu-open', open)
  }

  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true')
  })

  // A link that jumps to a section should also close the menu that covers it.
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false)
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false)
      toggle.focus()
    }
  })

  // Resizing past the breakpoint reveals the full nav; make sure the open-menu
  // state and the body scroll lock do not survive into the desktop layout.
  const desktop = window.matchMedia(DESKTOP_QUERY)
  desktop.addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false)
  })

  /* ---------------------------------------------------- scroll + header -- */

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24)
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  /* ------------------------------------------------------ active section -- */

  const links = [...menu.querySelectorAll('a[href^="#"]')]
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean)

  if (!sections.length || !('IntersectionObserver' in window)) return

  // Track which sections are on screen and highlight the topmost one. A plain
  // IntersectionObserver ratio would flicker between two tall adjacent
  // sections, so the state is kept in a Set and the earliest section in
  // document order wins.
  const visible = new Set()

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }

      const current = sections.find((section) => visible.has(section.id))

      for (const link of links) {
        const isCurrent = current && link.getAttribute('href') === `#${current.id}`
        if (isCurrent) link.setAttribute('aria-current', 'true')
        else link.removeAttribute('aria-current')
      }
    },
    {
      // Ignore the top band occupied by the sticky header, and treat a section
      // as "current" once it is reasonably far into the viewport.
      rootMargin: '-30% 0px -55% 0px',
      threshold: 0,
    },
  )

  for (const section of sections) observer.observe(section)
}

/**
 * Contact cards and footer links come from data.js so the address only exists
 * in one place.
 */
export function renderContact() {
  const email = document.querySelector('[data-contact="email"]')
  if (email) {
    email.setAttribute('href', `mailto:${site.email}`)
    const value = email.querySelector('.contact__value')
    if (value) value.textContent = site.email
  }

  for (const link of document.querySelectorAll('[data-github]')) {
    link.setAttribute('href', site.github)
  }

  const year = document.getElementById('year')
  if (year) year.textContent = String(new Date().getFullYear())
}