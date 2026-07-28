<template>
  <DashboardLayout title="Project information">
    <section class="about-hero">
      <div class="about-hero__copy">
        <span class="eyebrow">Independent full-stack portfolio project</span>
        <h2>{{ brand.productName }}</h2>
        <p>
          Hospitality Review Intelligence demonstrates database-backed guest-review aggregation, explainable
          sentiment and topic classification, property-level analytics, operational insights, filtering,
          reporting, and a bounded public-review collection workflow.
        </p>
        <div class="about-actions">
          <a
            class="button button--primary"
            :href="brand.portfolioUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            View portfolio
          </a>
          <a
            class="button button--secondary"
            :href="brand.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub profile
          </a>
        </div>
      </div>
      <div class="about-hero__mark" aria-hidden="true">
        <span>HRI</span>
        <small>Full-stack analytics</small>
      </div>
    </section>

    <section class="about-section">
      <div class="section-heading">
        <span class="eyebrow">Application architecture</span>
        <h3>How the system is connected</h3>
        <p>
          The browser never connects directly to the database. Every request moves through a validated service
          layer before Prisma queries PostgreSQL.
        </p>
      </div>
      <div class="architecture-flow" aria-label="Application architecture">
        <article v-for="(step, index) in architectureSteps" :key="step.title">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.description }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="about-section">
      <div class="section-heading">
        <span class="eyebrow">Backend implementation</span>
        <h3>Designed for traceable, reliable review processing</h3>
        <p>
          The backend separates collection, ingestion, storage, analytics, and presentation so each concern
          can be maintained and verified independently.
        </p>
      </div>
      <div class="backend-grid">
        <article v-for="area in backendAreas" :key="area.title" class="backend-card">
          <span>{{ area.label }}</span>
          <h4>{{ area.title }}</h4>
          <p>{{ area.description }}</p>
          <ul>
            <li v-for="item in area.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="about-methodology">
      <div>
        <span class="eyebrow">Explainable methodology</span>
        <h3>Rules that can be inspected</h3>
        <p>
          Overall sentiment is derived from the stored 0–10 rating: 8 or above is positive, 6–7.9 is neutral,
          and below 6 needs attention. A versioned phrase dictionary can assign multiple operational topics to
          one review and stores the matched phrase as evidence.
        </p>
      </div>
      <div class="methodology-topics">
        <span v-for="topic in topics" :key="topic">{{ topic }}</span>
      </div>
    </section>

    <section class="about-section">
      <div class="section-heading">
        <span class="eyebrow">Product capabilities</span>
        <h3>From stored reviews to operational clarity</h3>
        <p>The interface reads its review, rating, topic, and analytics data from the backend API.</p>
      </div>
      <div class="feature-grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card">
          <span>{{ feature.symbol }}</span>
          <h4>{{ feature.title }}</h4>
          <p>{{ feature.description }}</p>
        </article>
      </div>
    </section>

    <section class="data-note data-note--friendly about-disclaimer">
      <div class="data-note__mark">i</div>
      <div>
        <h3>Implementation status</h3>
        <p>
          The dashboard, API, PostgreSQL schema, analytics, classification, persistence pipeline, collector,
          and run-history endpoints are implemented. The collector stops safely when an external source
          requests access verification; deployment-specific collection behaviour still requires runtime
          verification.
        </p>
        <p class="about-disclaimer__legal">{{ brand.disclaimer }}</p>
      </div>
    </section>
  </DashboardLayout>
</template>

<script>
import { portfolioBrand } from '../config/portfolio-brand.js'
import DashboardLayout from '../layouts/DashboardLayout.vue'

export default {
  name: 'AboutView',
  components: { DashboardLayout },
  data() {
    return {
      brand: portfolioBrand,
      architectureSteps: [
        {
          title: 'Vue 3 interface',
          description: 'Responsive views, filters, Chart.js visualisations, and CSV reporting.',
        },
        {
          title: 'Pinia and Axios',
          description: 'Options Stores manage state and modular clients call the REST endpoints.',
        },
        {
          title: 'NestJS services',
          description: 'Controllers validate requests before analytics and ingestion services run.',
        },
        {
          title: 'Prisma and PostgreSQL',
          description: 'Relational models persist reviews, topics, evidence, and collection history.',
        },
      ],
      backendAreas: [
        {
          label: 'API',
          title: 'Validated REST architecture',
          description:
            'NestJS modules separate properties, reviews, dashboards, analytics, insights, health, and collection.',
          items: [
            'DTO validation and controlled query parameters',
            'Swagger documentation under /api/docs',
            'Paginated review feed with search and sorting',
          ],
        },
        {
          label: 'DATA',
          title: 'Relational persistence',
          description:
            'Prisma provides one typed application-wide client over a PostgreSQL schema designed for review analytics.',
          items: [
            'Property, Review, Topic, ReviewTopic, and ScraperRun models',
            'UUIDv7 identifiers, indexes, checks, and unique constraints',
            'Idempotent database seed for the configured project dataset',
          ],
        },
        {
          label: 'INGEST',
          title: 'Bounded collection pipeline',
          description:
            'Playwright processes configured properties sequentially with conservative limits and central selectors.',
          items: [
            'Configurable pages, timeouts, retries, and delays',
            'Fallback selectors and missing-field handling',
            'Safe stop for CAPTCHA or access-verification pages',
          ],
        },
        {
          label: 'INTEGRITY',
          title: 'Normalisation and deduplication',
          description:
            'Every collected record passes through the same validation and classification path before storage.',
          items: [
            'SHA-256 content fingerprint plus external review ID',
            'Transactional Review and ReviewTopic persistence',
            'Per-property success, partial, and failed run history',
          ],
        },
      ],
      topics: [
        'Cleanliness',
        'Check-in',
        'Staff behaviour',
        'Noise',
        'Facilities',
        'Location',
        'Room condition',
        'Value for money',
      ],
      features: [
        {
          symbol: '01',
          title: 'Comparable-period KPIs',
          description: 'Current and previous-week rating, volume, sentiment, and change calculations.',
        },
        {
          symbol: '02',
          title: 'Review exploration',
          description: 'Search, property, date, sentiment, topic, rating, sorting, and pagination controls.',
        },
        {
          symbol: '03',
          title: 'Property comparison',
          description: 'Side-by-side ratings, review volume, sentiment share, and period movement.',
        },
        {
          symbol: '04',
          title: 'Operational insights',
          description: 'Evidence-backed statements calculated from distinct negative review mentions.',
        },
        {
          symbol: '05',
          title: 'Data reliability states',
          description: 'Loading, empty, error, partial-data, low-sample, and collection-status feedback.',
        },
        {
          symbol: '06',
          title: 'Reporting',
          description: 'Responsive dashboard visualisations, shareable filters, and CSV exports.',
        },
      ],
    }
  },
}
</script>
