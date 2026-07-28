<template>
  <DashboardLayout title="Review coverage">
    <section class="page-intro page-intro--compact">
      <div>
        <span class="eyebrow">Guest feedback</span>
        <h2>Review data & updates</h2>
        <p>See which hotels are included and check for newly published feedback.</p>
      </div>
      <button class="button button--primary" :disabled="updateDisabled" @click="handleSync">
        {{ updateButtonLabel }}
      </button>
    </section>

    <AppAlert v-if="scraperError" tone="warning" title="Review update unavailable" :message="scraperError" />
    <AppAlert v-else-if="syncMessage" title="Review update" :message="syncMessage" />

    <AppSkeleton v-if="propertiesLoading" variant="cards" :count="3" />
    <section v-else class="health-grid">
      <article class="health-card">
        <span class="health-card__icon health-card__icon--success">✓</span>
        <div>
          <small>Guest feedback</small>
          <strong>Ready to explore</strong>
          <p>{{ totalReviewsLabel }}</p>
        </div>
      </article>
      <article class="health-card">
        <span class="health-card__icon health-card__icon--neutral">
          {{ scraperStatus?.isRunning ? '↻' : '✓' }}
        </span>
        <div>
          <small>Review updates</small>
          <strong>{{ statusLabel }}</strong>
          <p>{{ updateStatusDetail }}</p>
        </div>
      </article>
      <article class="health-card">
        <span class="health-card__icon health-card__icon--info">{{ properties.length }}</span>
        <div>
          <small>Hotels included</small>
          <strong>{{ properties.length === 4 ? 'All four ready' : `${properties.length} available` }}</strong>
          <p>Sydney hotels included in this overview</p>
        </div>
      </article>
    </section>

    <section class="panel coverage-panel">
      <div class="panel__header">
        <div>
          <span class="eyebrow">Portfolio coverage</span>
          <h3>Hotels included</h3>
        </div>
        <StatusBadge
          :label="`${properties.length} hotels ready`"
          :tone="properties.length ? 'positive' : 'neutral'"
          dot
        />
      </div>

      <AppSkeleton v-if="propertiesLoading" :count="4" />
      <EmptyState
        v-else-if="propertiesError"
        title="Hotel list unavailable"
        :message="propertiesError"
        action-label="Try again"
        symbol="!"
        @action="fetchProperties"
      />
      <div v-else class="health-table">
        <div class="health-row health-row--head">
          <span>Hotel</span><span>Guest feedback</span><span>Latest update</span><span>Availability</span>
        </div>
        <div v-for="property in properties" :key="property.id" class="health-row">
          <strong>{{ property.name }}</strong>
          <span data-label="Guest feedback">Booking.com reviews</span>
          <span data-label="Latest update">{{ propertyUpdatedAt(property.id) }}</span>
          <div class="health-row__status" data-label="Availability">
            <StatusBadge
              :label="propertyStatus(property.id).label"
              :tone="propertyStatus(property.id).tone"
              dot
            />
          </div>
        </div>
      </div>
    </section>

    <section v-if="latestRuns.length" class="panel coverage-panel">
      <div class="panel__header">
        <div>
          <span class="eyebrow">Update history</span>
          <h3>Latest check for each hotel</h3>
        </div>
      </div>
      <div class="health-table">
        <div class="health-row health-row--head run-row">
          <span>Hotel</span><span>Result</span><span>Found</span><span>Saved</span><span>Completed</span>
        </div>
        <div v-for="run in latestRuns" :key="run.id" class="health-row run-row">
          <strong>{{ run.property?.name ?? 'Portfolio' }}</strong>
          <div class="health-row__status" data-label="Result">
            <StatusBadge :label="runStatus(run.status).label" :tone="runStatus(run.status).tone" dot />
          </div>
          <span data-label="Found">{{ run.reviewsFound }}</span>
          <span data-label="Saved">{{ run.reviewsInserted + run.reviewsUpdated }}</span>
          <span data-label="Completed">{{ formatDateTime(run.completedAt ?? run.startedAt) }}</span>
        </div>
      </div>
    </section>

    <section class="data-note data-note--friendly">
      <div class="data-note__mark">i</div>
      <div>
        <h3>About review updates</h3>
        <p>
          Hotels update one at a time at a conservative rate. If Booking.com requests an access verification,
          collection stops safely and the existing dashboard data remains available.
        </p>
      </div>
    </section>
  </DashboardLayout>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import AppAlert from '../components/common/AppAlert.vue'
import AppSkeleton from '../components/common/AppSkeleton.vue'
import EmptyState from '../components/common/EmptyState.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { usePropertiesStore } from '../stores/properties.js'
import { useScraperStore } from '../stores/scraper.js'

const RUN_PRESENTATION = {
  success: { label: 'Updated', tone: 'positive' },
  partial: { label: 'Partially updated', tone: 'neutral' },
  failed: { label: 'Not updated', tone: 'neutral' },
  running: { label: 'Updating', tone: 'neutral' },
}

export default {
  name: 'DataHealthView',
  components: { AppAlert, AppSkeleton, DashboardLayout, EmptyState, StatusBadge },
  data() {
    return {
      pollTimer: null,
      syncMessage: '',
    }
  },
  computed: {
    ...mapState(usePropertiesStore, {
      properties: 'properties',
      propertiesLoading: 'loading',
      propertiesError: 'error',
    }),
    ...mapState(useScraperStore, {
      scraperStatus: 'status',
      runs: 'runs',
      scraperLoading: 'loading',
      scraperSyncing: 'syncing',
      scraperError: 'error',
    }),
    updateDisabled() {
      return this.scraperLoading || this.scraperSyncing || this.scraperStatus?.isRunning
    },
    updateButtonLabel() {
      if (this.scraperSyncing) return 'Starting update…'
      if (this.scraperStatus?.isRunning) return 'Checking reviews…'
      return 'Check for new reviews'
    },
    statusLabel() {
      if (this.scraperStatus?.isRunning) return 'Update in progress'
      if (this.scraperStatus?.lastSuccessfulSync) return 'Up to date'
      return 'Ready for first update'
    },
    updateStatusDetail() {
      if (this.scraperStatus?.isRunning) {
        const count = this.scraperStatus.activeRunCount
        return `${count} ${count === 1 ? 'hotel is' : 'hotels are'} being checked`
      }
      if (this.scraperStatus?.lastSuccessfulSync) {
        return `Last completed ${this.formatDateTime(this.scraperStatus.lastSuccessfulSync)}`
      }
      return 'Use the button to collect public feedback'
    },
    totalReviewsLabel() {
      return this.runs.length
        ? 'Stored feedback remains available during updates'
        : 'Demonstration feedback is currently available'
    },
    latestRunByProperty() {
      return new Map((this.scraperStatus?.properties ?? []).map((item) => [item.property?.id, item]))
    },
    latestRuns() {
      const unique = new Map()
      for (const run of this.runs) {
        const key = run.propertyId ?? run.property?.id ?? run.id
        if (!unique.has(key)) unique.set(key, run)
      }
      return [...unique.values()].slice(0, this.properties.length || 4)
    },
  },
  async mounted() {
    await Promise.all([this.fetchProperties(), this.fetchStatus()])
    if (this.scraperStatus?.isRunning) this.pollStatus()
  },
  beforeUnmount() {
    window.clearTimeout(this.pollTimer)
  },
  methods: {
    ...mapActions(usePropertiesStore, ['fetchProperties']),
    ...mapActions(useScraperStore, ['fetchStatus', 'startSync']),
    async handleSync() {
      this.syncMessage = ''
      try {
        const result = await this.startSync()
        this.syncMessage = result.message
        await this.fetchStatus()
        this.pollStatus()
      } catch {
        // The Pinia store exposes a user-safe API error.
      }
    },
    pollStatus(attempt = 0) {
      window.clearTimeout(this.pollTimer)
      if (attempt >= 40 || !this.scraperStatus?.isRunning) return
      this.pollTimer = window.setTimeout(async () => {
        await this.fetchStatus()
        if (this.scraperStatus?.isRunning) {
          this.pollStatus(attempt + 1)
        } else {
          this.syncMessage = 'The review update finished. Dashboard data is ready.'
          await this.fetchProperties()
        }
      }, 3000)
    },
    propertyUpdatedAt(propertyId) {
      const run = this.latestRunByProperty.get(propertyId)
      return run ? this.formatDateTime(run.completedAt ?? run.startedAt) : 'Not checked yet'
    },
    propertyStatus(propertyId) {
      const run = this.latestRunByProperty.get(propertyId)
      return run ? this.runStatus(run.status) : { label: 'Ready', tone: 'positive' }
    },
    runStatus(status) {
      return RUN_PRESENTATION[status] ?? { label: 'Ready', tone: 'neutral' }
    },
    formatDateTime(value) {
      if (!value) return 'Not available'
      return new Intl.DateTimeFormat('en-AU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    },
  },
}
</script>
