# Azzurro Review Insights

Operations dashboard for analysing guest review sentiment and recurring issues
across Azzurro Hotels properties.

## Assessment status

The PostgreSQL-backed dashboard, review feed, analytics APIs, insights,
explainable classification pipeline, and bounded Playwright collector are
implemented. The included 48 demonstration reviews remain synthetic and must
not be described as collected guest reviews. A bounded live collection must be
run successfully before final submission.

- [Requirement-by-requirement assessment status](docs/assessment-status.md)
- [Remaining implementation plan and ScraperRun lifecycle](docs/remaining-work.md)
- [Architecture and Prisma model overview](docs/project-overview.md)
- [Public collection method and limitations](docs/collection-method.md)

## Local database setup

Prerequisites: Node.js, Docker Desktop, and npm.

```bash
docker compose up -d postgres
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npx playwright install chromium
npm run start:dev
```

The API is served at `http://localhost:3000/api` and Swagger at
`http://localhost:3000/api/docs`.

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard is served at `http://localhost:5173`.

To run a bounded collection for all four active properties:

```bash
cd backend
npm run scrape
```

Collection runs sequentially at a conservative rate. It stops safely on CAPTCHA
or access-verification pages instead of attempting a bypass. See the
[collection method](docs/collection-method.md) for duplicate handling,
classification, configuration, and limitations.

The Vue application uses modular API clients and Pinia Options Stores. Chart.js
and `vue-chartjs` power the rating, sentiment, and topic visualisations.
Dashboard and review sections include skeleton loading, partial-data warnings,
retryable errors, empty states, low-sample warnings, URL-synchronised filters,
and load-more pagination.

For a deployed frontend, copy `frontend/.env.example` and set `VITE_API_URL` to
the public NestJS API origin before running the production build.

## Database design

PostgreSQL is accessed through a single application-wide Prisma client. The
schema contains `Property`, `Review`, `Topic`, `ReviewTopic`, and `ScraperRun`.
Every model uses a native PostgreSQL `uuid` column populated with Prisma
UUIDv7, giving globally unique and time-ordered identifiers.

Review ingestion is protected by unique constraints on both
`(propertyId, externalReviewId)` and `(propertyId, fingerprint)`. Read-path
indexes cover property/date feeds, date trends, sentiment trends, topic
analytics, rating filters, and scraper status history. Database checks keep
ratings, nights stayed, confidence values, and run counters within valid
ranges.

The seed command is idempotent and creates the four configured properties,
eight operational topics, and 48 clearly marked synthetic demo reviews. Demo
dates are distributed across the current and previous comparable weeks using
`APP_TIMEZONE`; rerunning the seed updates the same synthetic source records
instead of inserting duplicates.

## Useful backend commands

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db seed
npx prisma migrate status
npm run build
```

`npx` runs the locally installed Prisma binary. Use spaces between the binary
and its subcommands: `npx prisma migrate dev`. Do not use
`npx run prisma:generate` or `npx prisma:migrate dev`; those ask npx to locate
the wrong package or file.

For dependency security checks, use `npm audit --omit=dev` to assess packages
shipped with the production API. Review suggested major-version changes before
using `npm audit fix --force`.

Do not commit `.env`; only `.env.example` belongs in source control.

## Core API

All routes use the `/api` prefix.

| Route | Purpose |
| --- | --- |
| `GET /properties` | Active configured properties |
| `GET /reviews` | Paginated review feed and filters |
| `GET /reviews/:id` | Full review with topic evidence |
| `GET /dashboard/overview` | Current and comparable-period KPIs |
| `GET /analytics/property-ratings` | Property rating breakdown |
| `GET /analytics/rating-trend` | Daily average rating |
| `GET /analytics/sentiment-trend` | Daily sentiment counts |
| `GET /analytics/topics` | Topic frequency and review percentages |
| `GET /insights` | Evidence-backed negative-review statements |
| `POST /scraper/sync` | Start a manual background review update |
| `GET /scraper/status` | Portfolio update status |
| `GET /scraper/runs` | Recent per-property collection history |

Review filters include `page`, `limit`, `propertyId`, `from`, `to`,
`sentiment`, `topic`, `minRating`, `maxRating`, `search`, and `sort`.
Analytics endpoints accept comma-separated `propertyIds` plus optional `from`
and `to` dates. If custom dates are omitted, the API compares Monday through
today with the equivalent portion of the previous week in `APP_TIMEZONE`.

Empty rating datasets return `null` averages and changes. Percentage helpers
also return `null` when there is no valid denominator, preventing `NaN` and
`Infinity` from reaching the dashboard.
