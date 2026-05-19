<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Golf Sheet — Agent Onboarding

Welcome. This is a single-user golf scorecard tracker. The owner is a recreational golfer in Quebec; we're optimizing for *their* experience, not a generic SaaS app. Below is everything you need to make changes safely.

## TL;DR for the impatient

```bash
npm install
# DATABASE_URL must be Postgres — see "Database" below
echo 'DATABASE_URL="postgresql://..."' > .env.local
echo 'ANTHROPIC_API_KEY="sk-ant-..."' >> .env.local
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

- Production lives at <https://golf-sheet-senecaljfs-projects.vercel.app> (Vercel Hobby, behind Deployment Protection).
- Repo: <https://github.com/SenecalJF/golf-sheet>. Pushing to `main` auto-deploys.
- Every code change to anything user-facing must work on **both mobile and desktop**.

## What the app does

Three core jobs:

1. **Log rounds.** Either manually (type in scores) or by uploading scorecard photos (Claude vision reads them).
2. **Compute handicap.** World Handicap System (WHS) — sliding scale lookup on the last 20 score differentials, with proper 9-hole pairing.
3. **Show insights.** Score trend, per-course stats, par-type averages, per-hole heatmap, AI-generated natural-language summary.

Visual style is fixed: **dark theme + golf-green accent**, modern + sporty. Don't change this without explicit user instruction.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind 4 + shadcn/ui (base-ui primitives under the hood) |
| Charts | Recharts |
| Forms | react-hook-form + zod |
| DB | Postgres via `@prisma/adapter-pg` (Prisma 7) |
| AI | `@anthropic-ai/sdk` — Claude Sonnet 4.6 default, Opus 4.7 fallback |
| Validation | zod everywhere user data enters the system |
| Hosting | Vercel Hobby + Vercel Postgres (Neon) |
| Date/time | `date-fns` |

**Important:** Next.js 16 + Tailwind 4 + Prisma 7 are *all* recent majors with breaking changes. Always check actual installed versions before assuming an API.

## Directory map

```
app/
  layout.tsx                    Root: theme, sidebar (desktop) + topbar (mobile), Toaster
  page.tsx                      Dashboard (empty state OR <Dashboard rounds=…/>)
  rounds/{,new/,[id]/}          List · multi-photo+AI flow · detail
  courses/{,[id]/}              Course list · tee editor
  analytics/                    Trend/par-type/heatmap/AI tabs (course-filterable)
  settings/                     API key status, DB stats
  api/
    extract-scorecard/route.ts  POST: photos -> structured JSON via Claude vision
    insights/route.ts           POST: stats -> NL summary via Claude
    rounds/{,[id]/}             CRUD; round POST recomputes scoreDiff
    courses/{,[id]/tees/}       CRUD; tee PATCH/POST for upserts
components/
  shared/nav.tsx                DesktopNav (sticky sidebar) + MobileTopBar (drawer)
  dashboard/                    handicap-card, trend-chart, bento dashboard
  rounds/                       new-round-flow, hole-score-grid, round-delete-button
  courses/                      tee-editor, add-course-dialog
  analytics/                    par-type-chart, hole-heatmap, ai-insights-panel
  ui/                           shadcn primitives — edit cautiously
lib/
  db.ts                         Prisma singleton — LAZY proxy (see Gotchas)
  anthropic.ts                  Client + MODELS constants
  scorecard-prompt.ts           Cacheable system prompt for vision OCR
  handicap.ts                   WHS calculations (verified by scripts/verify-handicap.ts)
  stats.ts                      Aggregations: trend, par type, heatmap, per-course
  types.ts                      Zod schemas + parsePars/formatPars helpers
  resize-image.ts               Browser-side JPEG downscale (pre-upload)
  utils.ts                      `cn()` only
prisma/
  schema.prisma                 Course / Tee / Round / HoleScore
  migrations/                   Generated SQL; commit them
  seed.ts                       Pre-loaded Quebec courses (idempotent upsert)
scripts/
  verify-handicap.ts            Run with `npx tsx scripts/verify-handicap.ts`
```

## Database

- **Schema is fixed-provider Postgres.** Don't switch back to SQLite — it broke the Vercel build last time.
- Models: `Course → Tee → Round → HoleScore`. See `prisma/schema.prisma` for fields.
- `Tee.pars` is a CSV string ("4,4,3,5,...") because Prisma's SQLite legacy doesn't have arrays; we kept the format on Postgres for portability. Use `parsePars()` / `formatPars()` from `lib/types.ts`.
- `Round.totalStrokes`, `Round.totalPar`, and `Round.scoreDiff` are **cached on write** (in the POST `/api/rounds` handler). When you change the handicap formula, you may need to backfill.

### Connecting locally

`vercel env pull` returns **empty strings** for any env var Vercel flags as "Sensitive" — which includes everything the Vercel Postgres integration creates. You have two options:

1. **Copy `DATABASE_URL` from the Vercel UI** (Settings → Environment Variables → eye icon) into `.env.local` manually.
2. **Use a Neon dev branch** so dev/prod data stay separated.

Don't commit `.env.local`. The `.env*` glob in `.gitignore` already covers it; only `.env.example` is exempted.

### Schema changes

```bash
# 1) Edit prisma/schema.prisma
# 2) Generate a migration without needing a shadow DB:
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script 2>/dev/null > prisma/migrations/<timestamp>_<name>/migration.sql
# 3) Apply it
DATABASE_URL=… npx prisma migrate deploy
# 4) Commit the migration file
```

Vercel runs `prisma migrate deploy` automatically inside `vercel-build` (see `package.json`), so pushing a new migration applies it on next deploy.

## AI — Claude vision

- Default model: `claude-sonnet-4-6`. Opus 4.7 is available via `model=hard` form field; the UI exposes it only when extraction confidence is low.
- **Prompt caching is on.** The system prompt has a `cache_control: { type: "ephemeral" }` breakpoint. Don't rebuild the prompt per request — keep it stable so the cache hits.
- Multi-photo upload sends up to 6 image content blocks in a single user message. Claude merges them.
- The prompt asks Claude to return strict JSON conforming to `ExtractedScorecardSchema` in `lib/types.ts`. If you add fields, update the schema AND the prompt's example, OR Claude will silently omit them.
- Per-hole `confidence` is calibrated 0–1. The UI buckets: ≥0.85 green, 0.6–0.85 amber, <0.6 red.

When adding any new Claude call:

- Always go through `getAnthropic()` from `lib/anthropic.ts`.
- Wrap in try/catch and return 502 with `{ error: string }` on AI failure.
- Set `export const maxDuration = N` on the route — Vercel Hobby's default 10s timeout will silently 502 vision calls. Use 60s for OCR, 30s for chat-style.
- Set `export const runtime = "nodejs"` (we use `sharp` for image resize which doesn't run on Edge).

## Handicap

Implemented in `lib/handicap.ts`. WHS 2024:

```
Score Differential = (113 / Slope) × (AGS − Course Rating − PCC)
```

- AGS uses a `par + 5` cap until a handicap index exists, then proper Net Double Bogey.
- Handicap = average of the lowest N of the last 20 differentials, with adjustment, where N is a sliding-scale function of how many rounds you've played.
- 9-hole rounds: paired chronologically into 18-hole-equivalent diffs. Unpaired 9-hole rounds are excluded from the index until a partner round exists.

Tests: `npx tsx scripts/verify-handicap.ts`. **Run this after any change** to `lib/handicap.ts`.

## Conventions

- **No comments unless the WHY is non-obvious.** Don't narrate the WHAT.
- **Server components by default.** Use `"use client"` only when needed (interactivity, browser-only APIs).
- **All page routes touching the DB use `export const dynamic = "force-dynamic"`** so they don't try to render at build time.
- **Lazy-load the Prisma client.** `lib/db.ts` exports a Proxy that throws on use, not on import — keeps `next build` happy without a live DB URL.
- **zod everywhere data crosses a boundary** (form-data parse, JSON body parse, AI output parse).
- Tailwind: use the theme variables (`bg-card`, `border-border`, etc.) — don't hard-code colors. The dark palette is set in `app/globals.css`.
- shadcn components are from the base-ui port, not the older Radix-based shadcn. **There is no `asChild` on most primitives** — use the `render` prop or apply `buttonVariants()` directly. Custom `asChild` was added to `Button` and `DialogTrigger` only.
- Custom `cn(...)` is the only utility in `lib/utils.ts`. Don't add helpers there without justification.

## Mobile-first checklist

This app must work great on phone. After any UI change:

1. Check at 375px (mobile) — sidebar collapses to a topbar + drawer.
2. Wide grids (hole grid, heatmap) must scroll horizontally inside their card, not break the layout.
3. Tap targets ≥ 40px tall. Use `h-10`/`h-11` for inputs on mobile.
4. Don't add hover-only affordances (use focus + tap states too).

## Gotchas (read these before debugging)

1. **`vercel env pull` returns empty strings** for Sensitive env vars. Don't trust the resulting `.env.local` for secrets — pull manually from the UI.
2. **The lazy Prisma proxy** in `lib/db.ts` means errors about missing `DATABASE_URL` won't fire until you actually call `prisma.foo.bar(...)`. If the build mysteriously passes but runtime 500s say "DATABASE_URL is not set", that's why.
3. **Prisma 7 + `prisma.config.ts`**: the `provider` is in `schema.prisma` and the URL comes from `process.env.DATABASE_URL` via `prisma.config.ts`. Don't move it back into the schema — Prisma 7 rejects that.
4. **Hydration errors from nested buttons.** Base-ui's `DialogTrigger` renders its own `<button>`; if you wrap a `<Button>` inside it with `asChild`, you get `<button><button>`. The fix is to apply `buttonVariants()` to the trigger directly (see `add-course-dialog.tsx`).
5. **`maxDuration` is mandatory** for routes that call Claude. Without it, Vercel Hobby kills the request at 10s and you get a 502 with empty logs.
6. **Vercel serverless filesystem is not writable** across requests. Image uploads in `/api/extract-scorecard` check `process.env.VERCEL` and skip filesystem persistence on prod — the original photo is only sent to Claude in memory. Locally, photos are saved to `public/uploads/`.
7. **Vercel body limit is 4.5MB** on Hobby. Client-side resize via `lib/resize-image.ts` runs before upload — never bypass it.
8. **Don't commit `.claude/settings.local.json`** — it's user-specific permissions. Already gitignored.

## Deploying

Production is wired to `main`. Any `git push origin main` triggers a Vercel build that:

1. `npm install` (postinstall runs `prisma generate`)
2. `npm run vercel-build` = `prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build`
3. Deploy

The seed is idempotent (skips if `count >= COURSES.length`). The migration is idempotent (`migrate deploy` skips already-applied migrations).

For manual deploys: `vercel deploy --prod`.

## What NOT to do

- Don't add a new ORM / DB / framework / styling system without checking with the owner.
- Don't add background jobs, webhooks, or workers. This is a single-user app with sync request/response everywhere.
- Don't add user auth / multi-tenancy / admin panels. Single user.
- Don't add `console.log` noise to production code paths. Use the existing `toast` system for user feedback.
- Don't write new migration files by hand — always go through `prisma migrate diff`.
- Don't add tests for the sake of having tests. The handicap verifier (`scripts/verify-handicap.ts`) is the canonical correctness check; expand it instead of inventing new harnesses.

## Useful commands

```bash
npm run dev              # Next dev server
npm run build            # Local production build (no migrate, no seed)
npm run db:seed          # Seed (idempotent)
npm run db:reset         # Drop + remigrate + reseed (LOCAL only)
npm run db:studio        # Prisma Studio against the configured DB

npx tsc --noEmit         # Type check
npx tsx scripts/verify-handicap.ts   # Handicap correctness check

# Vercel
vercel ls golf-sheet --yes           # List recent deploys
vercel logs <url> --expand           # Runtime logs
vercel inspect <url> --logs          # Build logs (failed builds)
vercel curl <url>/api/courses        # Authenticated request against prod
```

## When in doubt

The owner uses this app on their phone after every round. Optimize for that: speed, clarity, working offline-tolerant UX, and trust the AI to do the boring data entry. Visual polish is part of the product, not a nice-to-have.
