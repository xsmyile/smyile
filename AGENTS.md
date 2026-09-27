# AGENTS.md

Guidance for coding agents working in this repository.

## Project

Personal site (https://smyile.com): cyberpunk-themed, terminal-first SPA with GitHub activity, projects and network. Deployed to GitHub Pages on every `master` push.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** (build tool)
- **TanStack Router** (type-safe file-based routing, single index route)
- **Tailwind CSS v4** + custom CSS theme variables (`src/styles.css`)
- **Framer Motion** (animations)
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

**Single-page app** with one route (`/`), terminal-first ("Signal" layout): name, status readout and a large terminal above the fold, projects and network below.

```
src/
├── main.tsx                    # React 19 root + router setup
├── styles.css                  # Theme variables, custom animations, global styles
├── routes/route-tree.ts        # TanStack Router tree (single index route)
├── components/
│   ├── signal-page.tsx         # Page shell: boot, background, ticker, hero, sections, Sissy pet
│   ├── signal-hero.tsx         # whoami reveal, name, readout (Rome time, last push, active repo)
│   ├── terminal-window.tsx     # Interactive terminal (history, Tab completion, touch-only chips)
│   ├── signal-sections.tsx     # Projects list + network tree
│   ├── sissy-pet.tsx           # Draggable, blinking Sissy easter egg (spawned only by `sissy`)
│   ├── ticker-strip.tsx        # Top marquee of recent activity
│   └── boot-sequence.tsx       # Splash animation (skipped on revisit via sessionStorage)
├── hooks/
│   ├── use-github.ts           # Profile, events (owner-filtered), star totals
│   ├── use-boot-sequence.ts    # Boot animation timing + state
│   └── use-uptime.ts           # Session timer
└── lib/
    ├── github-api.ts           # GitHub REST client with localStorage caching (5-min TTL)
    ├── terminal-commands.ts    # CLI command handlers and Tab completion
    ├── sissy-silhouette.ts     # SVG paths from the Sissy app (body + separate eye)
    ├── visitor-id.ts           # Browser fingerprinting
    └── constants.ts            # Identity, projects, network, social links, version
```

**Data flow:** `useGitHub()` → `Promise.allSettled()` → state → props to hero/terminal/ticker.

**Activity filter:** only events from owners in `ACTIVITY_OWNERS` (own account + own orgs) reach the UI; other orgs never appear on the site.

**Caching:** localStorage with `smyile_v{VERSION}_` prefix, 5-min TTL, stale fallback on API errors. Old version keys auto-purged on load.

**Responsive:** one column that stacks; projects and network sit side by side from 900px. Terminal command chips show only on touch (`pointer: coarse`).

## Release Process

```bash
./scripts/release.sh <major|minor|patch>  # Updates version in package.json, lock, constants.ts
# Then: commit, tag, push (script prints instructions)
```

Tags trigger the release workflow which auto-generates changelog from conventional commits (feat/fix/perf/chore).

## Key Conventions

- GitHub API is public (no auth token) — subject to rate limits
- `/api` routes proxy to `localhost:8080` in dev (Vite config)
- Version string must stay in sync across `package.json`, `package-lock.json`, and `src/lib/constants.ts`
- SPA routing: deploy copies `index.html` → `404.html` for GitHub Pages
