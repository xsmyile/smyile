# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio dashboard (https://smyile.com) — cyberpunk-themed SPA showing GitHub activity, interactive terminal, and developer stats. Deployed to GitHub Pages on every `master` push.

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

**Single-page app** with one route (`/`). All UI composes inside `DashboardLayout`.

```
src/
├── main.tsx                    # React 19 root + router setup
├── styles.css                  # Theme variables, custom animations, global styles
├── routes/route-tree.ts        # TanStack Router tree (single index route)
├── components/
│   ├── dashboard-layout.tsx    # Responsive 3-col grid (desktop) / drawer layout (mobile)
│   ├── boot-sequence.tsx       # Splash animation (skipped on revisit via sessionStorage)
│   ├── module-panel.tsx        # Reusable glass card wrapper for all modules
│   └── modules/                # Feature modules rendered inside the dashboard grid
├── hooks/
│   ├── use-github.ts           # Main data fetching (profile, repos, events, releases)
│   ├── use-boot-sequence.ts    # Boot animation timing + state
│   ├── use-media-query.ts      # Responsive breakpoint (1024px)
│   └── use-uptime.ts           # Session timer
└── lib/
    ├── github-api.ts           # GitHub REST client with localStorage caching (5-min TTL)
    ├── terminal-commands.ts    # CLI command handlers for interactive terminal
    ├── visitor-id.ts           # Browser fingerprinting
    └── constants.ts            # Projects, social links, skills, version
```

**Data flow:** `useGitHub()` → `Promise.allSettled()` → state → props to modules.

**Caching:** localStorage with `smyile_v{VERSION}_` prefix, 5-min TTL, stale fallback on API errors. Old version keys auto-purged on load.

**Responsive:** Desktop = 3-col CSS grid. Mobile = stacked center + slide-in drawers (Framer Motion spring) with body scroll lock.

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
