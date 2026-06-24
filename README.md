# Kural

Kural is a Tamil-first, mobile-first news reader built with Next.js, React, Zustand, SQLite, RSS ingestion, and browser speech playback. The app keeps your original concept: a first-time login/register screen appears once, then the selected user profile is stored in the browser with Zustand/localStorage so the same browser opens directly into the app next time.

## Current focus

- Mobile-first Tamil Nadu news experience.
- Tamil Nadu-only RSS filtering before articles enter the database.
- Free RSS/public feed coverage first; optional paid/API providers are disabled by default.
- Browser-local profile/login persistence.
- Male/female/auto voice preference using the browser SpeechSynthesis engine.
- Client refresh every 5 minutes and a Vercel cron route for server-side feed sync.
- Optional admin dashboard for developers only, disabled in production unless explicitly enabled.

## Getting started

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy the example file and fill only what you use:

```bash
cp .env.example .env.local
```

Free RSS mode works without API keys. Optional keys are only needed if you enable AI analysis, AI images, or API-backed news providers.


## Native SQLite and Next.js runtime note

`better-sqlite3` is a native Node.js package. Files that import it must stay on the Node.js server runtime and must not be imported by client components, Edge routes, or instrumentation. The project keeps `src/instrumentation.ts` intentionally empty and sets `export const runtime = "nodejs"` on routes that touch SQLite, RSS sync, image generation, or filesystem uploads.

If you see `Module not found: Can't resolve 'fs'` with an import trace through `better-sqlite3`, it means a server-only file was pulled into a browser/Edge bundle. Check the import trace and remove that server import from client/instrumentation code.

## News updates every 5 minutes

The browser calls `/api/news` every 5 minutes through the Zustand news store. The repository also includes `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-feeds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

For Vercel deployment, keep in mind that frequent cron schedules depend on your Vercel plan. If your plan does not allow 5-minute cron jobs, use an external cron service to call `/api/cron/sync-feeds` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`.

## Tamil Nadu-only filtering

RSS articles are filtered in:

```text
src/lib/rss/tn-filter.ts
```

The filter now rejects weak source-only matches and only accepts articles with strict Tamil Nadu relevance, Tamil Nadu district/city signals, or strong Tamil Nadu government/local/news terms. Other states, other countries, world news, and general national politics are rejected before insert.

## RSS source registry

Source files live in:

```text
src/lib/rss/sources/
```

The source registry is:

```text
src/lib/rss/sources/index.ts
```

The compatibility bridge is:

```text
src/lib/rss/sources.ts
```

Do not keep competing source lists. `sources.ts` should only re-export from `sources/index.ts`.

## Admin page

The admin page is not needed for normal readers. It is useful only for you/developers to check RSS health, article counts, and sync status.

Production behavior:

- `/admin` is hidden/disabled unless `NEXT_PUBLIC_ENABLE_ADMIN=true`.
- `/api/admin/stats` is disabled unless `ENABLE_ADMIN_API=true` and a bearer secret is provided.

Recommended for boss demo: keep admin disabled and show the mobile reader experience.

## Browser voice

Kural uses the browser Web Speech API through `SpeechSynthesis`. The app exposes Tamil/English language, speed, voice picker, and male/female/auto preference. Voice quality depends on the device/browser voices installed on the user device. For studio-quality human-like voices, replace or extend the engine with a cloud TTS provider later.

## Local profile concept

The app intentionally stores the current user in the browser. Returning users on the same browser do not see login again.

This is good for a demo, prototype, or low-risk reader app. It is not server authentication and should not be used for sensitive accounts or payments.

## Database

Local development uses SQLite in `data/`. On Vercel, the app falls back to `/tmp/kural-data` to avoid write errors. That is fine for demos but not durable. For real production traffic, use durable storage such as Turso/libSQL, Neon/Supabase Postgres, or another hosted database, and move uploads/generated images to object storage.

## Useful scripts

```bash
npm run dev        # start development server
npm run typecheck  # TypeScript validation
npm run lint       # ESLint validation
npm run build      # production build
npm run start      # start built app
```

## Before deployment

- Do not deploy `.env` files or old shared API keys.
- Reinstall dependencies on the target OS with `npm ci`; do not copy `node_modules` between Windows/Linux/macOS.
- Keep `node_modules`, `.next`, local DB files, uploads, and generated files out of the deployment zip/repository.
- Set `CRON_SECRET` if using an external cron caller.
