# AGENTS.md

Guidance for coding agents working in this repository.

## Project

Personal site (https://smyile.com): minimal SPA over a 3D fall through a tesseract, with projects, links and a terminal. Deployed to GitHub Pages on every `master` push.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** (build tool)
- **TanStack Router** (type-safe file-based routing, single index route)
- **Tailwind CSS v4** + custom CSS theme variables (`src/styles.css`)
- **three.js** (backdrop scene, loaded with a dynamic import so the page text never waits for it)
- **Framer Motion** (fullscreen terminal transition)
- **Biome** (linter + formatter — no eslint/prettier)

## Commands

```bash
npm run dev          # Start dev server (localhost)
npm run build        # Type-check (tsc -b) then Vite build
npm run preview      # Preview production build
npm run check        # Biome auto-fix (lint + format)
npm run lint         # Lint only
npm run format       # Format only
```

CI uses `bun install --frozen-lockfile` and `bun run build`.

## Code Style (Biome)

- Tabs, 100-char line width, double quotes, no semicolons (`asNeeded`)
- Organize imports automatically
- Run `npm run check` before committing

## Architecture

**Single-page app** with one route (`/`): a full-screen three.js fall through an endless lattice of glass bars and glowing blocks, behind four corners of text. Top left the name in Major Mono Display and the role, top right the one-line prompt, bottom left the projects (the first one featured), bottom right orgs and social links.

```
src/
├── main.tsx                    # React 19 root + router setup
├── styles.css                  # Color tokens (:root + @theme inline), Sissy animations
├── routes/route-tree.ts        # TanStack Router tree (single index route)
├── components/
│   ├── home-page.tsx           # Page shell: backdrop, corners, fullscreen terminal, Sissy pet
│   ├── home-sections.tsx       # Projects list and orgs/social links
│   ├── tesseract-backdrop.tsx  # Loads the scene, frame loop, wheel and swipe boost, hold to slow time, pointer look, reduced motion
│   ├── prompt-line.tsx         # One-line prompt: runs a command and opens the fullscreen terminal
│   ├── terminal-fullscreen.tsx # Edge-to-edge TTY fullscreen terminal (Ctrl+K, /#terminal)
│   ├── terminal-output.tsx     # Shared output line and prompt rendering
│   ├── sissy-pet.tsx           # Draggable, blinking Sissy easter egg (spawned only by `sissy`)
│   └── stale-reload-boundary.tsx # Reloads once when a stale chunk fails after a deploy
├── hooks/
│   ├── use-github.ts           # Profile, events (owner-filtered), star totals
│   ├── use-terminal-session.ts # Shared terminal history, input and key handling
│   └── use-uptime.ts           # Session uptime helper (getUptime)
└── lib/
    ├── tesseract-world.ts      # three.js scene: recycled lattice chunks, shattering wall panels, twist shader, bloom and lens passes
    ├── tunnel-timeline.ts      # Pure timeline: fall speed, palettes, twist envelope, streaks
    ├── css-color.ts            # Reads a #rrggbb CSS token as 0..1 RGB
    ├── storage.ts              # tryStorage: Web Storage calls that degrade when storage is unavailable
    ├── url.ts                  # displayHost for showing URLs without scheme
    ├── motion.ts               # Shared prefers-reduced-motion query
    ├── github-api.ts           # GitHub REST client with localStorage caching (5-min TTL)
    ├── terminal-commands.ts    # CLI command handlers and Tab completion
    ├── sissy-silhouette.ts     # SVG paths from the Sissy app (body + separate eye)
    ├── visitor-id.ts           # Browser fingerprinting
    └── constants.ts            # Identity, projects, network, social links, version
```

**Data flow:** `useGitHub()` → `Promise.allSettled()` → state → terminal session (`stats` command).

**Activity filter:** only events from owners in `ACTIVITY_OWNERS` (own account + own orgs) reach the UI; other orgs never appear on the site.

**Caching:** localStorage with `smyile_{VERSION}_` prefix, 5-min TTL, stale fallback on API errors. Keys of other versions auto-purged on load; unversioned keys (`smyile_last_login`) persist across deploys.

**Readability:** text in `--ink` (near white) and `--muted`; the lens pass darkens the screen edges with a vignette so the corners stay legible over the scene. `--scene` tints the glass bars.

**Responsive:** the corners stack on narrow screens; the backdrop renders at a pixel ratio capped at 1.25. Terminal command chips show only on touch (`pointer: coarse`).

## Release Process

The git tag is the only version source: `vite.config.ts` runs `git describe --tags` at build time. On a tag the site shows `X.Y.Z`, after it `X.Y.Z+N.gSHA`. No version field in `package.json`, no bump commit.

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
```

The tag triggers the release workflow: changelog from conventional commits (feat/fix/perf/chore), then a redeploy of `master` so the site shows the clean version. Tag the `master` head; builds need full history and tags (`fetch-depth: 0`).

## Key Conventions

- GitHub API is public (no auth token) — subject to rate limits
- `/api` routes proxy to `localhost:8080` in dev (Vite config)
- SPA routing: deploy copies `index.html` → `404.html` for GitHub Pages
