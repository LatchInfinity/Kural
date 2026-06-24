# Free Tamil Nadu news source notes

This project prioritizes free/public RSS-style feeds first. Optional paid/API providers are inactive by default unless you turn them on and provide keys.

## Added or fixed free sources

- OneIndia Tamil official RSS feed plus category feeds.
- Kumudam official RSS category feeds: latest, Tamil Nadu, district news, politics, current affairs, crime, business, weather, sports, cinema, and health.
- Dinamani RSS feed.
- News18 Tamil RSS and Tamil Nadu Google News search feed.
- Google News Tamil search feeds for Tamil Nadu, Chennai, politics, government, education, business, weather, crime, transport, agriculture, sports, and cinema.
- Existing Tamil publisher feeds/scrapers such as Daily Thanthi, Dinamalar, Hindu Tamil Thisai, Maalai Malar, Malai Murasu, Makkal Kural, Vikatan, Thanthi TV, Polimer, and others.

## Tamil Nadu-only rule

Feeds can contain mixed news, so `src/lib/rss/tn-filter.ts` decides what enters the database. The current version is strict: articles from other states, other countries, world news, general national politics, Bollywood/Hollywood, and weak non-local items are rejected.

## Where to edit sources

```text
src/lib/rss/sources/index.ts
src/lib/rss/sources/google_news.ts
src/lib/rss/sources/kumudam.ts
src/lib/rss/sources/oneindia.ts
src/lib/rss/sources/dinamani.ts
src/lib/rss/sources/news18.ts
```

## Source behavior

Each source can use one of these approaches:

1. `feedUrl`: parsed with `rss-parser`.
2. `scraper`: fallback HTML extraction when RSS is unavailable.
3. `apiProvider`: optional provider source, disabled by default.

Google News search feeds improve free coverage, but the strict Tamil Nadu filter still decides whether an article is saved.
