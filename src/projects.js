import { projects } from './data.js'

/**
 * Renders the project cards and their expandable case-study panels.
 *
 * Everything is built with DOM APIs rather than innerHTML with interpolated
 * strings: the content comes from data.js today, but a screenshot path or a
 * project name is exactly the sort of thing that later becomes user-supplied,
 * and building nodes is the habit that does not need re-auditing then.
 */

/**
 * Resolve a path in `public/` against Vite's base.
 *
 * `new URL(path, import.meta.url)` would be wrong here: a bare relative path
 * resolves against the *current document* URL, so on a nested address such as
 * `/Portfolio/pagebuilder` the browser would ask for
 * `/Portfolio/pagebuilder/screenshots/x.png` and get a 404. BASE_URL is `/` in
 * dev and `/Portfolio/` in the production build, which is exactly the prefix
 * the files were published under.
 */
function asset(path) {
  return `${import.meta.env.BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1')
}

/** Create an element with attributes and children in one call. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue

    if (key === 'class') {
      node.className = value
    } else if (key === 'text') {
      node.textContent = value
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value)
    } else {
      node.setAttribute(key, value)
    }
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue
    node.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }

  return node
}

/** An external link that is honest about where it goes. */
function externalLink(href, className, label) {
  return el('a', {
    class: className,
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
    text: label,
  })
}

/**
 * The case-study panel. Rendered inline (not injected on click) and hidden with
 * the `hidden` attribute, so its text is present for find-in-page and for
 * anything crawling the page, and so there is no layout shift on expand.
 */
function buildDetail(project) {
  const rows = project.detail.map((row) =>
    el('div', { class: 'detail__row' }, [
      el('dt', { class: 'detail__label', text: row.label }),
      el('dd', { class: 'detail__text', text: row.text }),
    ]),
  )

  return el('div', { class: 'card__detail', id: `${project.id}-detail`, hidden: true }, [
    el('dl', { class: 'detail' }, rows),
    el('p', { class: 'detail__stack' }, [
      el('span', { class: 'detail__label', text: 'Built with' }),
      el(
        'span',
        { class: 'detail__text' },
        project.stack.map((tech) => el('span', { class: 'chip', text: tech })),
      ),
    ]),
  ])
}

/** One project card: screenshot, description, actions, expandable detail. */
function buildCard(project) {
  const hasRepo = Boolean(project.repo)

  const toggle = el('button', {
    class: 'btn btn--quiet card__toggle',
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': `${project.id}-detail`,
    text: 'Read the details',
  })

  const actions = [
    externalLink(project.demo, 'btn btn--primary', 'View live demo'),
    hasRepo ? externalLink(project.repo, 'btn btn--ghost', 'Source code') : null,
    toggle,
  ].filter(Boolean)

  return el('article', { class: 'card', id: project.id }, [
    el('div', { class: 'card__media' }, [
      el('img', {
        class: 'card__shot',
        src: asset(project.screenshot),
        alt: `Screenshot of ${project.name} \u2014 ${project.tagline.toLowerCase()}`,
        loading: 'lazy',
        decoding: 'async',
        width: '1280',
        height: '800',
      }),
    ]),

    el('div', { class: 'card__body' }, [
      el('div', { class: 'card__head' }, [
        el('h3', { class: 'card__title', text: project.name }),
        el('span', { class: 'card__tagline', text: project.tagline }),
      ]),

      el('p', { class: 'card__summary', text: project.summary }),

      el(
        'ul',
        { class: 'tags', 'aria-label': `Technologies used in ${project.name}` },
        project.stack.map((tech) => el('li', { class: 'tag', text: tech })),
      ),

      el('div', { class: 'card__actions' }, actions),

      buildDetail(project),
    ]),
  ])
}

/**
 * Wires the expand/collapse behaviour.
 *
 * Delegated from the container rather than bound per button: one listener,
 * and it keeps working for any card added later without re-binding.
 */
function wireToggles(root) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('.card__toggle')
    if (!button || !root.contains(button)) return

    const panel = document.getElementById(button.getAttribute('aria-controls'))
    if (!panel) return

    const willOpen = button.getAttribute('aria-expanded') !== 'true'

    button.setAttribute('aria-expanded', String(willOpen))
    panel.hidden = !willOpen
    button.textContent = willOpen ? 'Hide the details' : 'Read the details'

    // Announce the state change to screen readers without moving focus.
    const card = button.closest('.card')
    if (card) card.dataset.open = willOpen ? 'true' : 'false'
  })
}

export function renderProjects() {
  const root = document.getElementById('projects')
  if (!root) return

  root.replaceChildren(...projects.map(buildCard))
  wireToggles(root)
}