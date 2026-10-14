/**
 * Single source of truth for every piece of content on the page.
 *
 * Keeping the copy here (rather than scattered through index.html and the
 * render modules) means there is exactly one place to correct a link or a
 * sentence before deploy.
 *
 * HOUSE RULE (from PROJECT-PLAN.md section 5 / 9): never invent user numbers,
 * testimonials, revenue or "success stories". Everything below is either a
 * real, confirmed link or a plain description of what the thing does.
 */

export const site = {
  name: 'Mustapha Tijjani Haruna',
  email: 'mustaphatijjaniharuna@gmail.com',
  github: 'https://github.com/mustaphatijjaniharuna-max',
  githubHandle: 'mustaphatijjaniharuna-max',
}

/**
 * The three featured projects, strongest first.
 *
 * `detail` powers the expandable case-study panel. Each entry is a
 * { label, text } pair so the panel can render a consistent <dl> instead of
 * a pile of ad-hoc markup.
 *
 * `repo` is intentionally optional: PROJECT-PLAN.md requires source links be
 * verified before publishing, so a project without a confirmed repo simply
 * does not render that button rather than linking a guess.
 */
export const projects = [
  {
    id: 'pagebuilder',
    name: 'Pagebuilder',
    tagline: 'A mini website builder',
    year: '2025',
    // Live demo — confirmed by the user.
    demo: 'https://mustaphatijjaniharuna-max.github.io/Pagebuilder/',
    repo: 'https://github.com/mustaphatijjaniharuna-max/Pagebuilder',
    screenshot: 'screenshots/pagebuilder.png',
    // Screenshots live in `public/screenshots/` and are copied verbatim to the
    // build output root. The path is resolved against Vite's BASE_URL below so
    // it works both at `/` in dev and at `/Portfolio/` on GitHub Pages.
    summary:
      'A mini website builder I\u2019m working on to make creating websites more accessible. The goal is to help people who need a website get started without making the process unnecessarily difficult.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    detail: [
      {
        label: 'The problem',
        text: 'Getting a first website online usually means either learning a whole toolchain or handing the job to someone else. Both are a lot to ask of a person who just needs a page that works.',
      },
      {
        label: 'The idea',
        text: 'A builder that keeps the editing surface small: add sections, change the content, see the result. Aimed at people who need a simple site and do not want to fight the tool.',
      },
      {
        label: 'How it works',
        text: 'The interface is built around direct manipulation of the page itself rather than a separate settings panel, so what you edit is what you get.',
      },
      {
        label: 'Still being explored',
        text: 'This is an idea I am still developing, not a finished product. I have no user numbers or traction to report, and I would rather say that plainly than imply otherwise.',
      },
    ],
  },
  {
    id: 'craftfolio',
    name: 'Craftfolio',
    tagline: 'A portfolio and resume maker',
    year: '2025',
    demo: 'https://mustaphatijjaniharuna-max.github.io/craftfolio/',
    repo: 'https://github.com/mustaphatijjaniharuna-max/craftfolio',
    screenshot: 'screenshots/craftfolio.png',
    summary:
      'A tool for creating portfolios and resumes, built to help people present their work and experience online.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    detail: [
      {
        label: 'The problem',
        text: 'Presenting your work well is its own skill, separate from doing the work. People who have plenty to show often end up with nothing published because the formatting gets in the way.',
      },
      {
        label: 'The idea',
        text: 'Separate the content from the presentation. You supply the details; the tool handles how they are laid out.',
      },
      {
        label: 'The flow',
        text: 'Enter your details, see the result build up as you go, then take the finished portfolio or resume away with you.',
      },
      {
        label: 'Design decisions',
        text: 'The output had to look deliberate without any styling effort from the person using it, so the templates carry the design and the form stays plain.',
      },
    ],
  },
  {
    id: 'ideabox',
    name: 'Idea Box',
    tagline: 'A project idea generator',
    year: '2025',
    demo: 'https://mustaphatijjaniharuna-max.github.io/Idea-box/',
    repo: 'https://github.com/mustaphatijjaniharuna-max/Idea-box',
    screenshot: 'screenshots/ideabox.png',
    summary:
      'A project idea generator that suggests challenges based on a person\u2019s skill level, interests, and available time.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    detail: [
      {
        label: 'The problem',
        text: 'The hardest part of building something is often deciding what to build. Blank-page paralysis is real, and generic idea lists do not help because they ignore who is asking.',
      },
      {
        label: 'The idea',
        text: 'Ask for three things \u2014 skill level, interests, and how much time is available \u2014 and suggest something that actually fits those constraints.',
      },
      {
        label: 'How the inputs work',
        text: 'The three inputs narrow the suggestion space. A beginner with a weekend gets a different answer than someone experienced with a month.',
      },
      {
        label: 'How suggestions are presented',
        text: 'Each suggestion is a concrete brief rather than a one-line prompt, so it can be started immediately instead of being another thing to interpret.',
      },
    ],
  },
]

/**
 * Skills. Deliberately no percentages \u2014 PROJECT-PLAN.md section 7 rules them
 * out, and they do not mean much without a scale to compare against.
 */
export const skills = [
  {
    title: 'Web development',
    items: ['HTML', 'CSS', 'JavaScript', 'Python'],
  },
  {
    title: 'Tools',
    items: ['Git & GitHub', 'VS Code', 'AI coding tools'],
  },
  {
    title: 'Exploring',
    items: ['Three.js', '3D web experiences', 'Performance & deployment'],
  },
]

/** Contact channels. Only ones that are real and confirmed. */
export const contacts = [
  {
    label: 'Email',
    value: site.email,
    href: `mailto:${site.email}`,
    external: false,
  },
  {
    label: 'GitHub',
    value: site.githubHandle,
    href: site.github,
    external: true,
  },
]