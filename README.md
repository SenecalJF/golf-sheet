# Golf Sheet

A personal golf scorecard tracker. Photograph your scorecards, let Claude read the
handwriting, and watch your handicap, trends, and per-course stats update
automatically. Works on phone and desktop.

- 9-hole and 18-hole rounds
- AI scorecard OCR (Claude vision) with a review step
- World Handicap System (WHS) index, computed for you
- Pre-loaded list of Greater-Montreal courses
- Score trend, par-type averages, per-hole heatmap, AI insights
- Dark, golf-green dashboard

## Local development

Golf Sheet runs on **Postgres**. The easiest path for local dev is to point at the
same database you'll use in production (Vercel Postgres / Neon / Supabase free
tier). You can also run Postgres locally via Docker or Postgres.app.

```bash
npm install
echo 'DATABASE_URL="postgresql://..."' > .env.local
echo 'ANTHROPIC_API_KEY="sk-ant-..."'  >> .env.local   # optional, only for AI

npx prisma migrate dev --name init   # creates the schema
npm run db:seed                      # pre-loads 18 Montreal-area courses
npm run dev
```

Open <http://localhost:3000>.

The `ANTHROPIC_API_KEY` is optional — the app works fine with manual score entry.
Set it to enable scorecard photo OCR (default `claude-sonnet-4-6`, optional
`claude-opus-4-7` fallback) and AI insights.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Insert Montreal-area courses |
| `npm run db:reset` | Drop the DB, re-migrate, re-seed |
| `npm run db:studio` | Open Prisma Studio for the configured DB |

## Deploy to Vercel (free tier)

This repo is set up to deploy to Vercel with their built-in Postgres on the Hobby
plan. Steps:

1. Push to GitHub (see below if this is a fresh repo).
2. Go to <https://vercel.com/new> and import the repo. Vercel auto-detects Next.js.
3. **Before the first build**: in the Vercel project, open **Storage → Create →
   Postgres**. Vercel injects `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`
   and friends into the project's env. The app reads `DATABASE_URL`.
4. Open **Settings → Environment Variables** and add `ANTHROPIC_API_KEY` (set for
   Production + Preview).
5. Locally, pull the env Vercel set up and run the migration + seed once against
   the new database:

   ```bash
   vercel link        # connect this folder to your Vercel project
   vercel env pull .env.local
   npx prisma migrate deploy   # applies the migration to Vercel Postgres
   npm run db:seed             # seeds the 18 courses
   ```
6. Trigger a deployment (`vercel deploy --prod` or `git push`). Done.

### Scorecard images on Vercel

Vercel's serverless filesystem isn't writable across requests. The app detects this
(via the `VERCEL` env var) and skips persisting the original photo — Claude reads
the image in memory and you get the extracted scores back. The round detail page
just won't show the original card. If you want the photo to stick around, plug in
[Vercel Blob](https://vercel.com/docs/storage/vercel-blob) inside
`app/api/extract-scorecard/route.ts` (replace the `savedPath = "/uploads/..."`
branch with a `put(...)` call).

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind 4 + shadcn/ui + base-ui primitives + Recharts
- Prisma 7 + Postgres (via `@prisma/adapter-pg`)
- Anthropic SDK with Claude Sonnet 4.6 (default) and Opus 4.7 (fallback for messy
  scorecards). Vision OCR + prompt caching.
