# Developer Trial Assessment Status

Last reviewed: 28 July 2026

This document maps the original Booking.com Review Insights assessment to the
code that currently exists. It intentionally distinguishes complete features
from demonstration-only behaviour.

## Executive assessment

The dashboard, API, PostgreSQL schema, analytics, explainable classifier,
bounded Playwright collector, persistence pipeline, and scraper-run endpoints
are implemented. A bounded live verification on 28 July 2026 reached all four
public property pages, but the automated browser session did not receive
review cards from Booking.com's review dialog. The collector recorded safe,
per-property failures and preserved the existing dataset.

This means the product demonstration is strong, but the submission is not yet
complete against the assessment's most important reliability requirement.

## Requirement-by-requirement status

### 1. Review collection

| Requirement | Status | Current evidence | Required next work |
| --- | --- | --- | --- |
| Collect public review text, rating, date, and property | Implemented, awaiting live verification | Bounded Playwright collector and central selectors exist | Run against the supplied pages and adjust observed selectors if necessary |
| Collect other useful available information | Implemented | Optional reviewer, country, stay, room, traveller, title, and comment fields are extracted when present | Verify availability against live pages |
| Avoid duplicate reviews | Complete | External IDs, SHA-256 fingerprints, PostgreSQL constraints, and transactional writes are connected | Confirm a second live run reports skipped duplicates |
| Update with newly published reviews | Complete for manual/CLI use | Bounded rescans are idempotent and can be triggered by API or CLI | Add a Render schedule after deployment |
| Handle page changes | Implemented | Central selector fallbacks and diagnostic screenshots exist | Maintain selectors after a real page change |
| Handle temporary failures | Complete | Timeouts, safe blocking detection, per-property isolation, partial/failed states, and stale-run recovery exist | Verify real failure reporting |
| Document approach and limitations | Complete for implementation | Dedicated collection documentation exists | Add observations and sample counts from live verification |

### 2. Operations dashboard

| Requirement | Status | Notes |
| --- | --- | --- |
| Current-week average rating | Complete | Returned by `GET /api/dashboard/overview` |
| Previous-week comparison | Complete | Uses an equivalent previous-period comparison |
| Property rating breakdown | Complete | API and Chart.js visualisation are connected |
| Review feed | Complete | Live PostgreSQL-backed feed with load-more pagination |
| Date filter | Complete | Available on dashboard and review feed |
| Property filter | Complete | Available on dashboard and review feed |
| Positive and negative trends | Complete | Sentiment trend API and Chart.js visualisation are connected |
| Non-technical usability | Complete for current features | Friendly labels, responsive layout, skeletons, empty/error states, and demo-data disclosure |

Additional completed product features include topic, sentiment, rating, search,
and sort filters, CSV download, shareable filter URLs, topic analytics, and
evidence-backed insight statements.

### 3. Review insights

| Requirement | Status | Notes |
| --- | --- | --- |
| Eight requested operational topics | Complete | All requested topics are seeded |
| Group the demonstration reviews | Complete | Synthetic records include topic associations |
| Classify newly collected reviews | Complete | Normalised collected reviews pass through the classifier before persistence |
| Sentiment method | Complete | Central rating thresholds are used by seed and live ingestion |
| Insight percentage | Complete for stored classifications | API calculates the share of negative reviews mentioning each negative topic |
| Methodology and limitations | Complete | Rules, evidence, and limitations are documented |

### 4. Deliverables

| Deliverable | Status | Notes |
| --- | --- | --- |
| Complete source repository | Partial pending live evidence | Collector code is present; a verified real sample is still required |
| README setup instructions | Complete | Database, API, frontend, browser, and scraper commands are included |
| README architecture overview | Complete | More collection detail will be added after the prototype |
| README collection method | Complete | Detailed method is linked from the root README |
| README limitations and assumptions | Complete for implementation | Add any property-specific observations after the live run |
| Working local application | Complete with synthetic data | API and UI run locally |
| Public demo | Deferred | Planned for Vercel, Render, and Neon |
| Sample reviews collected from listed properties | Missing | Current 48 reviews are clearly marked synthetic |
| No committed secrets | Complete | Environment templates are committed; local values are ignored |

## What remains

The remaining delivery work should be completed in this order:

1. Recheck collection from the deployed Render environment; Booking.com can
   return different review-dialog state to different browser sessions.
2. Collect and verify a small real sample from all four properties.
3. Run a second collection and confirm unchanged reviews are skipped.
4. Record the verified sample size, date, and observed limitations.
5. Deploy PostgreSQL to Neon, the API/collector to Render, and Vue to Vercel.

Automated test-case files are intentionally not part of the selected delivery
scope. Production builds, Prisma checks, bounded collection runs, and manual
frontend/API acceptance checks provide final verification.

## Implemented classification method

A deterministic keyword classifier is suitable for this assessment because it
is explainable, inexpensive, reproducible, and easy to demonstrate.

### Normalisation

Before matching:

- combine title, review text, positive comment, and negative comment;
- convert Unicode text to a consistent form;
- lowercase and collapse repeated whitespace;
- retain the original text for display and evidence;
- treat empty optional fields safely.

### Overall sentiment

Use the existing Booking.com rating thresholds:

- `8.0–10.0` → positive;
- `6.0–7.9` → neutral;
- below `6.0` → negative.

This method is predictable, but rating and written comments can disagree. That
limitation must be stated in the README.

### Topic classification

Maintain a versioned keyword and phrase dictionary for the eight requested
topics. Match phrases with word boundaries and allow multiple topics per
review. Store:

- the selected topic;
- topic-level sentiment;
- a bounded confidence score;
- a short matched phrase as evidence.

Positive-comment matches should normally be positive, and negative-comment
matches should normally be negative. When the same topic occurs in both, use
the stronger match and retain evidence. The classifier must not invent a topic
when there is no match.

### Known limitations

- Keyword rules can miss synonyms, spelling errors, sarcasm, or context.
- A rating-based overall sentiment can disagree with written feedback.
- Topic confidence is a rule score, not a statistical probability.
- Rules should be reviewed after examining unmatched real examples.

For a trial assessment, these limitations are acceptable when they are stated
clearly and the original review text remains available for human verification.

## Scraper reliability principles

- Collect only public review content.
- Confirm the intended collection remains compatible with the website terms
  and the organisation's approval before scheduled production use.
- Do not require a guest login or private cookies.
- Use a low request rate and small bounded page count.
- Do not attempt to bypass CAPTCHA or access blocks.
- Stop safely and record a failed or partial run when blocked.
- Process each property independently so one failure does not stop the others.
- Keep selectors in one module and parser logic separate from browser actions.
- Validate parsed records before writing to PostgreSQL.
- Save no sensitive browser state in source control.
- Use saved, sanitised development HTML only for manual parser debugging instead
  of repeatedly hitting the live website.

## Deployment plan

The planned platform split is appropriate:

- **Vercel:** Vue production build.
- **Render:** NestJS API and the Playwright-capable scraper process.
- **Neon:** managed PostgreSQL database.

Do not deploy the frontend before a public Render API is available. Render must
receive `DATABASE_URL`, the allowed Vercel origin, and the application timezone.
Vercel must receive `VITE_API_URL` at build time. Production migrations should
run with `npx prisma migrate deploy`.

The Playwright browser and Render service limits must be verified before the
final deployment. If manual scraping takes longer than an HTTP request should
remain open, run it as a separate Render job or background worker and let the
API return run IDs immediately.
