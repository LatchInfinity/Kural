# Kural final fix notes

## Local profile/login behavior

Kept the original browser-local concept. First-time users see login/register, then the active profile is persisted in browser storage through Zustand/localStorage so returning users on the same browser go straight into the app.

Changed files:

- `src/components/auth/auth-guard.tsx`
- `src/components/auth/streak-popup.tsx`
- `src/store/user-store.ts`

## Full-project lint/build cleanup

Fixed the older full-project lint issues in admin, API routes, image/audio components, stores, and tooling.

Validated:

```bash
npm run lint
npm run typecheck
npm run build
```

All three pass in the cleaned project.

## Admin page decision

The admin page is not part of the public reader experience. It is useful only as a private developer dashboard for RSS health and sync status.

Production behavior added:

- `/admin` stays disabled unless `NEXT_PUBLIC_ENABLE_ADMIN=true`.
- `/api/admin/stats` requires `ENABLE_ADMIN_API=true` and a bearer secret.

Recommended demo mode: keep admin disabled and show the polished mobile reader.

## Mobile-first improvements

- Added a mobile live Tamil Nadu feed banner.
- Shows auto-refresh status and last update time.
- Added manual refresh and “new fresh stories” action.
- Improved featured story, stats strip, category chips, audio cards, and full player controls.
- Added male/female voice controls in the mobile full player.

Changed file:

- `src/components/mobile/MobileHome.tsx`

## Voice improvements

Added browser voice gender preference:

- `female`
- `male`
- `auto`

The engine now chooses the best available Tamil voice by language and preferred gender, then falls back gracefully if the device does not have a matching Tamil voice.

Changed files:

- `src/lib/audio-engine.ts`
- `src/store/app-store.ts`
- `src/components/audio-player-popup.tsx`
- `src/components/mobile/MobileHome.tsx`

## RSS/source fixes

Fixed the registry conflict by making `src/lib/rss/sources.ts` re-export the actual registry in `src/lib/rss/sources/index.ts`.

Free/public source coverage includes:

- OneIndia Tamil RSS and category feeds.
- Kumudam RSS category feeds.
- Dinamani RSS feed.
- News18 Tamil RSS and Tamil Nadu Google News fallback.
- Google News Tamil search feeds for Tamil Nadu categories.
- Existing Tamil publisher feeds/scrapers.

Optional API providers remain inactive by default:

- GNews
- NewsAPI
- Mediastack

## Tamil Nadu-only filtering

Made `src/lib/rss/tn-filter.ts` stricter:

- Removed weak “Tamil publisher source” acceptance.
- Removed weak low-score acceptance.
- Added stronger exclusions for other Indian states, other countries, world news, Bollywood/Hollywood, and national politics.
- Normalized keyword matching for Tamil/English terms.
- Requires district/city match or strong Tamil Nadu relevance before inserting.

## 5-minute updates

Added `vercel.json` with:

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

The client feed also refreshes every 5 minutes through `src/store/news-store.ts`.

## Vercel readiness

- Added `/tmp/kural-data` fallback for SQLite on Vercel demo deployments.
- Protected cron/admin/cleanup/refresh routes with reusable route auth helpers.
- Added env controls for admin and diagnostics.
- Removed generated/runtime artifacts from the final package.

For real production, use durable DB/object storage instead of local SQLite and local upload folders.
## Build/runtime fix - native SQLite import isolation

- Removed RSS scheduler imports from `src/instrumentation.ts` so Next.js no longer pulls `better-sqlite3` into instrumentation/browser/Edge compilation.
- Added `export const runtime = "nodejs"` to API routes that use SQLite, RSS sync, image generation, or filesystem uploads.
- Kept feed syncing through `/api/cron/sync-feeds` and client-side 5-minute refresh instead of a process-level scheduler.
- Tightened cron authorization to use `CRON_SECRET` bearer auth in production.
- Revalidated with `npm run lint`, `npm run typecheck`, and `npm run build`.

