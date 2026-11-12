# AGENTS.md

Guidance for coding agents working in this repository.

## Project

Personal site (https://smyile.com): minimal, monochrome SPA over a dithered tesseract, with projects, links and a terminal. Deployed to GitHub Pages on every `master` push.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** (build tool)
- **TanStack Router** (type-safe file-based routing, single index route)
- **Tailwind CSS v4** + custom CSS theme variables (`src/styles.css`)
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

**Single-page app** with one route (`/`): a full-screen dithered tesseract behind four corners of text. Top left the contour wordmark and the role, top right the one-line prompt, bottom left the projects (the first one featured), bottom right orgs and social links.

```
src/
├── main.tsx                    # React 19 root + router setup
├── styles.css                  # Color tokens (:root + @theme inline), Sissy animations
├── routes/route-tree.ts        # TanStack Router tree (single index route)
├── components/
│   ├── home-page.tsx           # Page shell: backdrop, corners, fullscreen terminal, Sissy pet
│   ├── home-sections.tsx       # Projects list and orgs/social links
│   ├── tesseract-backdrop.tsx  # Canvas loop for the tesseract scene (pointer, click, reduced motion)
│   ├── wordmark.tsx            # "Smyile" as dithered contours on an Unbounded 800 mask
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
    ├── tesseract-scene.ts      # Tesseract, corridor and strings rasterized to a dithered buffer
    ├── contour-wordmark.ts     # Distance field and flowing contours for the wordmark
    ├── dither.ts               # Bayer threshold, RGBA writes, CSS color tokens
    ├── github-api.ts           # GitHub REST client with localStorage caching (5-min TTL)
    ├── terminal-commands.ts    # CLI command handlers and Tab completion
    ├── sissy-silhouette.ts     # SVG paths from the Sissy app (body + separate eye)
    ├── visitor-id.ts           # Browser fingerprinting
    └── constants.ts            # Identity, projects, network, social links, version
```

**Data flow:** `useGitHub()` → `Promise.allSettled()` → state → terminal session (stats, fullscreen header).

**Activity filter:** only events from owners in `ACTIVITY_OWNERS` (own account + own orgs) reach the UI; other orgs never appear on the site.

**Caching:** localStorage with `smyile_{VERSION}_` prefix, 5-min TTL, stale fallback on API errors. Keys of other versions auto-purged on load; unversioned keys (`smyile_last_login`) persist across deploys.

**Readability:** elements marked `data-quiet` are quiet zones: the backdrop fades to nothing under them, so text stays legible over the scene.

**Responsive:** the corners stack on narrow screens; the backdrop uses 3px cells under 700px. Terminal command chips show only on touch (`pointer: coarse`).

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
