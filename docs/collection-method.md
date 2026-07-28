# Public Review Collection Method

## Overview

The backend uses Playwright with Chromium to read publicly visible review cards
for the four configured Booking.com property pages. It does not use guest
accounts, private cookies, credentials, or undocumented authentication.

Collection is deliberately bounded and sequential:

- active properties are processed one at a time;
- the default maximum is three review pages per property;
- a configurable delay is applied between pages;
- timeouts and selector fallbacks are centralised;
- CAPTCHA or access-verification content causes a safe stop;
- one property's failure does not stop the other properties.

Before scheduled production use, the intended collection should be confirmed
against the website terms and the organisation's approval.

## Processing flow

```text
Property booking URL
  -> create RUNNING ScraperRun
  -> open public page with Playwright
  -> accept optional public cookie notice
  -> open reviews or use the public review-list fallback
  -> extract bounded review cards
  -> normalise rating, dates, and optional text
  -> generate property-scoped SHA-256 fingerprint
  -> classify overall sentiment and operational topics
  -> transactionally save Review and ReviewTopic
  -> complete ScraperRun with status and counts
```

## Duplicate and update strategy

The collector prefers a stable review ID exposed by the page. Every review also
receives a SHA-256 fingerprint derived from:

- property ID;
- review date;
- rating;
- reviewer name;
- title and review text;
- positive and negative comments.

PostgreSQL unique constraints protect both identifiers. A repeated collection
of unchanged content is counted as a skipped duplicate. If a stable source ID
matches but content has changed, the review and its topic links are updated.

The current implementation performs a small bounded rescan instead of relying
on a fragile page watermark. This is predictable for four low-volume
properties, and database idempotency keeps repeated runs safe.

## Sentiment and topic methodology

Generative AI is not required for the first production version. The implemented
classifier is deterministic and explainable.

Overall sentiment follows the Booking.com 0–10 rating:

- `8.0–10.0`: positive;
- `6.0–7.9`: neutral;
- below `6.0`: negative.

A versioned phrase dictionary assigns any number of the eight requested
operational topics. Positive-comment matches are positive, negative-comment
matches are negative, and general-text matches inherit overall sentiment. Each
`ReviewTopic` stores confidence and the matched phrase as evidence.

This design lets reviewers explain every classification. A future AI fallback
could be added only for unmatched reviews without changing the database model.

## ScraperRun behaviour

One `ScraperRun` is created per property:

- `RUNNING` while the property is being processed;
- `SUCCESS` when bounded collection completes normally;
- `PARTIAL` when usable data is stored but some pages or reviews fail;
- `FAILED` when no reliable result is produced.

Counters record found, inserted, updated, and skipped reviews. Development
failures may save a local screenshot under `.scraper-debug/`; this directory is
ignored by Git and production does not write these screenshots.

Stale `RUNNING` rows older than one hour are safely converted to failed records
when the service starts or before a new run.

## Running locally

Install the browser once:

```bash
cd backend
npx playwright install chromium
```

Collect all active properties and wait for completion:

```bash
npm run scrape
```

Collect selected properties by UUID:

```bash
npm run scrape -- 019fa6f2-1939-7e53-b14a-f810810a65cc
```

The dashboard button uses:

```http
POST /api/scraper/sync
Content-Type: application/json

{}
```

The endpoint returns run IDs immediately. The frontend polls
`GET /api/scraper/status` and reads recent results from
`GET /api/scraper/runs`.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `SCRAPER_HEADLESS` | `true` | Run Chromium without a visible window |
| `SCRAPER_MAX_PAGES` | `3` | Maximum pages per property |
| `SCRAPER_TIMEOUT_MS` | `30000` | Navigation and selector timeout |
| `SCRAPER_DELAY_MS` | `1200` | Delay between review pages |

## Known limitations

- Booking.com markup can change; central selectors will need maintenance.
- Public pages can request CAPTCHA or access verification. The application
  records a safe failure and does not bypass it.
- Location, language, or availability context can change visible review
  content.
- Keyword rules can miss synonyms, spelling errors, sarcasm, or context.
- Rating-based overall sentiment can disagree with written comments.
- In-process API jobs can be interrupted by a Render restart. For scheduled
  production collection, use a Render job/background worker while keeping
  `ScraperRun` in Neon as the status record.

