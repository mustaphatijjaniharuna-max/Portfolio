# My 3D Developer Portfolio — Working Plan & Memory

> **Purpose of this file:** This is the persistent memory for this project. If a
> new session starts and you have no context, read this file first — it contains
> the full spec, the decisions already made, and exactly what is done and what
> is next. Do not delete it; it is the single source of truth for the build.

---

## 0. Status snapshot

_Last updated: 2026-10-13_

| Phase | Status |
|---|---|
| 0. Environment + recon | ✅ Done — Node v24.20.0 installed, Vite 7.3.7 builds clean |
| 1. Foundation (Vite, HTML, nav, sections, responsive, cards) | ✅ Done |
| 2. Content (hero, 3 projects, about, skills, how I build, contact, footer) | ✅ Done |
| 3. 3D (Three.js scene, lighting, camera, animation, interactions) | ✅ Done |
| 4. Polish (perf, mobile, a11y, links, build, deploy) | 🟡 Everything except the actual publish — build verified, deploy workflow added, nothing pushed yet |

### Blocker log
- ~~**Node.js 18.16.1 installed; Playwright/browser-automation needs Node 20+.**~~
  **RESOLVED** — Node is now **v24.20.0**.
- **`npm` is blocked in PowerShell by the execution policy.** `npm.ps1` cannot be
  loaded (`running scripts is disabled on this system`). Workarounds that work:
  call the entry point directly, e.g. `node "node_modules/vite/bin/vite.js" build`,
  or run `npm.cmd`. Do not report a build as broken because of this — it is the
  shell policy, not the project.
- **Playwright's `chrome-headless-shell` is not installed; only the full
  `chromium-1243` build is.** `scripts/capture-screenshots.mjs` therefore locates
  `chrome.exe` itself. That lookup had a bug: it only checked a `chrome-win`
  subfolder, but the current download unpacks to **`chrome-win64`**, so it
  returned `undefined` and `launch()` fell back to the missing headless-shell
  binary. **Fixed** — it now checks `chrome-win64` then `chrome-win`, and exits
  with an actionable message if neither exists.
- **`vite preview` serves `index.html` for every asset path — do not use it to
  QA a build.** Every request (`/Portfolio/assets/*.js`, `*.css`, even
  `screenshots/*.png`) came back `200 text/html`, including paths that do not
  exist. That made the build look broken (`cards: 0` and a 404 on the main
  bundle) when `dist/` was perfectly fine. **Verified** by serving `dist/` with a
  plain static server, where every asset returned the correct bytes and
  Content-Type. To QA the built site, serve `dist/` directly:
  `node scripts/qa-static-server.mjs` (port 4300), then browse
  `http://localhost:4300/Portfolio/`.
- **`git` is not installed on this machine, and the network is blocking the
  downloads that would fix it.** `winget install Git.Git` hangs with no child
  installer process (it needs a UAC prompt that is not being shown), and both
  `github.com/.../releases/...` and `git-scm.com/download/win` fail with
  `curl: (52) Empty reply from server`. `git-scm.com` itself loads, so it is the
  release CDN that is blocked. **Install Git manually** (or via GitHub Desktop,
  which bundles its own) before the push step below can happen. The VS Code
  **GitHub Actions** extension is installed, but it only edits workflows — it
  does not replace the Git CLI.

### QA — what was actually checked (2026-10-13)

Verified against a real browser (patchright/Chromium) loading the **built**
`dist/` through `scripts/qa-static-server.mjs`:

| Check | Result |
|---|---|
| Console errors / failed requests | **0 / 0** |
| Project cards rendered | 3 (Pagebuilder, Craftfolio, Idea Box) |
| Screenshots decoded | all three, 2400x1800 |
| Detail panel open/close + `aria-expanded` | works, label swaps correctly |
| Demo + source links | all 6 real URLs |
| Email / GitHub contact links | real, not placeholders |
| First tab stop | `A.skip-link` ✅ |
| Skip link revealed on focus | yes (settles to `top: 0`) |
| Mobile menu: open, scroll-lock, Escape-close, focus return | all pass |
| Horizontal overflow at 390px | none |

**Two false alarms worth remembering**, both cases of the *test* being wrong
rather than the page:

1. **"The cards are blank"** — a screenshot taken without first forcing the
   `loading="lazy"` images to decode. The cards looked empty in the capture
   while the DOM said `complete: true`. Force `loading='eager'` + `img.decode()`
   and scroll the page before shooting, then they render fine. No CSS bug — the
   image was correctly sized (557x419, `object-fit: cover`, opacity 1) and its
   pixels were present (sampled avg brightness 237).
2. **"The skip link is not the first tab stop"** — the interaction script
   pressed Tab *after* clicking the detail toggle and resizing the viewport, so
   focus had already moved. Checked on a pristine page it is correct. The script
   has been reordered so it cannot regress into the same mistake.

### QA tooling (added, keep these)
- `scripts/qa-static-server.mjs` — serves `dist/` as Pages does (port 4300).
  `npm run qa:serve`.
- `scripts/qa-interactions.mjs` — the full interaction/a11y pass above.
- `scripts/capture-screenshots.mjs` — re-captures the three card screenshots.
  `npm run screenshots`.

Run order: `npm run build` → `npm run qa:serve` → then point `browser.mjs` at
`http://localhost:4300/Portfolio/` with `--script scripts/qa-interactions.mjs`.

### Remaining before this is finished
1. `git init` + first commit (the repo has **no git history yet** — nothing is
   committed, so the Pages workflow cannot have run).
2. Push to `main` and set Settings → Pages → Source → **GitHub Actions**.
3. Confirm the deployed URL loads: https://mustaphatijjaniharuna-max.github.io/Portfolio/
4. Confirm the display name **Mustapha Tijjani Haruna** is correct (section 18).

### Key facts about the environment
- Project root: `c:\Users\NSSEC_FIN&ACCTS(HOD)\Desktop\Portfolio`
- Shell: PowerShell on Windows (win32, x64). **Use PowerShell cmdlets, not Unix.**
- The folder was **empty** at the start of this build.
- Folder name contains `&` and `(` `)` — **always quote paths** in commands.
- **Screenshots are captured by `scripts/capture-screenshots.mjs`**, not by the
  `browser-automation` skill's `browser.mjs` (that was the original plan). The
  script exists because a full-page capture is the wrong shape for a card: a
  1280 x ~6800 image cropped with `object-fit: cover` samples a thin band of
  mostly-empty background, so the cards looked blank. The script takes a
  **1200 x 900 (4:3) viewport** shot, which is the ratio `.card__media` uses, so
  almost nothing is cropped. Re-run it whenever a demo's UI changes.
- The capture script borrows `patchright` from the CodeGPT extension rather than
  adding it as a project dependency — it is build-time tooling, not something the
  site needs at runtime. Do not add it to `package.json`.

### Verified 2026-10-13 (all returned HTTP 200)
- Live demos: `/Pagebuilder/`, `/craftfolio/`, `/Idea-box/`
- Repos: `github.com/mustaphatijjaniharuna-max` + `/Pagebuilder`, `/craftfolio`,
  `/Idea-box`

Section 18 item 3 is therefore **done** — every repo URL resolves, so all three
`Source code` buttons stay.

---

## 1. Project overview

Build a futuristic, interactive **3D portfolio** that showcases real web
development projects, the approach to building them, and what the developer can
do. Modern and memorable **without being complicated**.

**Main goal:** get people interested in the work, let them explore projects, and
potentially contact for opportunities or collaborations.

**Tone:** straightforward, practical, focused on things actually built.

---

## 2. Tech stack (fixed)

- HTML
- CSS
- JavaScript
- **Three.js** — 3D graphics (https://threejs.org/, docs: https://threejs.org/docs/)
- **Vite** — dev + production builds (https://vite.dev/)
- **GitHub Pages** — free hosting (https://vite.dev/guide/static-deploy.html)

Use free tools wherever possible.

---

## 3. Visual direction

- Dark background; white / light-grey text.
- **One** accent colour — electric blue or violet.
- Floating geometric objects, subtle lighting and depth.
- Smooth, restrained animations; minimal UI elements.
- Impressive without hurting readability.
- **Not** a game, **not** a complicated virtual world.

---

## 4. Hero / Home

Include: name, short intro, clear description of what is built, primary
"Explore My Work" button, secondary "Get in Touch" button, and the main
interactive 3D scene.

Copy (use as-is unless corrected):
- **Headline:** "I build things for the web."
- **Intro:** "I'm a web developer who likes turning ideas into working products.
  I build, experiment, test things, and try to make useful ideas real."
- **Buttons:** "Explore My Work" · "Get in Touch"

**Avoid:** "passionate tech enthusiast", claiming expertise without evidence,
long paragraphs, fake statistics or achievements.

---

## 5. Featured projects (most important section after the hero)

Each card: project name · **real screenshot** · what it does · why it was built ·
technologies · live demo · source code (only once the URL is confirmed).

### Project 1 — Pagebuilder (strongest, show first)
- Live: https://mustaphatijjaniharuna-max.github.io/Pagebuilder/
- "A mini website builder I'm working on to make creating websites more
  accessible. The goal is to help people who need a website get started without
  making the process unnecessarily difficult."
- Highlight: the building experience, how the interface works, the problem it
  addresses, what was learned.
- **Be honest that the idea is still being explored.** No claims of users or traction.

### Project 2 — Craftfolio
- Live: https://mustaphatijjaniharuna-max.github.io/craftfolio/
- "A tool for creating portfolios and resumes, built to help people present their
  work and experience online."
- Highlight: the portfolio/resume creation flow, the final output, design
  decisions, what was learned.

### Project 3 — Idea Box
- Live: https://mustaphatijjaniharuna-max.github.io/Idea-box/
- "A project idea generator that suggests challenges based on a person's skill
  level, interests, and available time."
- Highlight: how the inputs work, how suggestions are presented, the user problem
  behind the idea, the implementation.

### Presentation rules
Real screenshots (never fake mockups) · obvious demo buttons · short
descriptions · strongest project first · verify each demo before publishing ·
add GitHub repo links only once URLs are confirmed.

---

## 6. About Me

Suggested copy (adjust anything that is not accurate):
> "I'm a web developer who enjoys building things and figuring out how to turn
> ideas into working products.
>
> I prefer practical projects over building things just for the sake of it. I
> like experimenting, learning through building, and finding ways to make
> technology useful to people.
>
> I'm still exploring what I can build next, and this portfolio is a collection
> of some of the things I've worked on."

Cover: approach to building products, interest in practical problem-solving, how
learning/experimenting happens, a few genuine details about the journey.
**Avoid:** life story, irrelevant personal info, fake client experience, claims
of solving problems at scale.

---

## 7. Skills and tools (only what can be explained/demonstrated)

- **Web development:** HTML, CSS, JavaScript
- **Tools:** Git & GitHub, VS Code, AI coding tools (if relevant to the projects)
- **Exploring:** Three.js, 3D web experiences, web performance & deployment

**No** arbitrary skill percentages (e.g. "JavaScript: 95%"). **No** impressive-
sounding tech that cannot be demonstrated.

---

## 8. How I Build

**Headline:** "I don't just want to build things. I want them to be useful."

- **01 — Find the problem.** Look for something people actually struggle with
  instead of inventing a problem to justify a product.
- **02 — Build a working version.** Start with the simplest version that can
  demonstrate the idea.
- **03 — Test it.** Use the product, check what breaks, find out whether it makes
  sense to other people.
- **04 — Improve it.** Make changes based on what is learned instead of adding
  features just because they can be added.

Keep it short and honest — present as an approach, not as a claim of extensive
user research.

---

## 9. Project details / case studies

Clicking a project reveals more detail (expandable panel or page) containing:
the problem/need, the idea and intended audience, the approach, technologies
used, a few real screenshots, challenges encountered, what was learned, what
would be improved next, and links to live project + source.

**Start with Pagebuilder** (it demonstrates the more interactive product-building
experience). **Never invent** user feedback, revenue, user numbers, or success
stories.

---

## 10. Contact

**Headline:** "Got an idea or want to work together?"
**Text:** "If you've got a project in mind, want to collaborate, or just want to
talk about something I've built, feel free to reach out."

Include: Email · GitHub · LinkedIn (only if wanted professionally).
GitHub profile: https://github.com/mustaphatijjaniharuna-max

**CONFIRMED:** Email = `mustaphatijjaniharuna@gmail.com` · GitHub =
https://github.com/mustaphatijjaniharuna-max · LinkedIn = omitted (not supplied).
No fake contact details; no buttons that do nothing.

---

## 11. Footer

Simple: name · GitHub link · copyright notice · link back to top. Nothing huge.

---

## 12. 3D experience

Three.js centrepiece: floating geometric structure, gentle rotation,
mouse-responsive camera, possibly interactive project objects, subtle particles,
smooth transitions. If project objects are clickable, make it clear what each
opens. **Never** hide all project info inside the 3D scene — everything must
remain reachable through normal page sections.

---

## 13. What NOT to build

Elaborate virtual world · unnecessary 3D models · animations on every element ·
long loading screens · autoplay music · fake testimonials · fake project
statistics · invented client projects · unverified expertise claims · skill bars
with arbitrary percentages · complicated navigation · features that do not
improve the experience · heavy effects that break mobile.

**The 3D supports the portfolio; it does not become the portfolio.**

---

## 14. Development steps

**Phase 1 — Foundation:** 1) create the Vite project 2) set up HTML structure
3) build nav + page sections 4) responsive styling 5) working project cards/links.

**Phase 2 — Content:** 6) hero intro 7) Pagebuilder, Craftfolio, Idea Box
8) About 9) Skills + How I Build 10) Contact + Footer.

**Phase 3 — 3D:** 11) install Three.js 12) create the scene 13) lighting + camera
14) animation 15) useful interactions 16) connect the 3D to the project showcase
where appropriate.

**Phase 4 — Polish:** 17) optimise the scene 18) test mobile 19) check
accessibility and readability 20) test every project link 21) production build
22) deploy to GitHub Pages.

---

## 15. Performance & accessibility

Small initial download · no overly detailed models · limited expensive animation
on mobile · respect `prefers-reduced-motion` · readable text and clear contrast ·
navigation works without touching the 3D scene · **WebGL fallback** · test on
slower connections and devices.

---

## 16. Definition of done

- Works on desktop and mobile.
- 3D scene works without breaking the page.
- Visitors understand what the developer does quickly.
- The three featured projects have working demos.
- Screenshots represent the real products.
- About section sounds natural.
- Skills and claims are accurate.
- Contact links work.
- Loads reasonably quickly.
- Every important feature has been tested.

---

## 17. Final principle

The 3D design gets attention. The projects show what can be built. The
explanations show how they think. The experience should make someone want to
explore the work — **not** fight their way through an animation.

---

## 18. CONFIRMED details (answered by the user, 2026-10-13)

1. **Email:** `mustaphatijjaniharuna@gmail.com` — use for the contact section
   (`mailto:` link) and the footer. This is a real address supplied by the user.
2. **GitHub profile:** https://github.com/mustaphatijjaniharuna-max
3. **Source repositories:** the repo URLs follow the pattern
   `https://github.com/mustaphatijjaniharuna-max/<ProjectName>` — the user
   confirmed the links are the profile name plus the project name. So:
   - Pagebuilder → https://github.com/mustaphatijjaniharuna-max/Pagebuilder
   - Craftfolio → https://github.com/mustaphatijjaniharuna-max/craftfolio
   - Idea Box   → https://github.com/mustaphatijjaniharuna-max/Idea-box
   **TODO before deploy: verify each repo URL resolves (no 404) — the README
   requires source links be confirmed. If one 404s, omit that link.**
4. **LinkedIn:** not supplied — **omit** the LinkedIn entry rather than link a
   guess. Contact = Email + GitHub only.
5. **Accent colour:** defaulting to **electric blue** unless the user changes it.
6. **Displayed name:** derived from the GitHub handle / email —
   **Mustapha Tijjani Haruna**. Confirm or correct before deploy.