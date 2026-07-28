<template>
  <DashboardLayout title="Portfolio overview">
    <section class="page-intro">
      <div>
        <span class="eyebrow">{{ periodLabel }}</span>
        <h2>How guests are feeling</h2>
        <p>A clear view of ratings, guest sentiment, and the issues that need attention.</p>
      </div>
      <button class="button button--secondary" :disabled="!summary" @click="downloadSummary">
        Export summary
      </button>
    </section>

    <AppAlert
      v-if="partial"
      tone="warning"
      title="Some dashboard sections are unavailable"
      message="Available data is shown below. Refresh to retry the missing sections."
    />
    <AppAlert
      v-else-if="summary?.reviewCount > 0 && summary.reviewCount < 5"
      tone="warning"
      title="Low sample size"
      message="Treat percentage changes carefully because fewer than five reviews match this selection."
    />

    <DashboardFilters
      :properties="availableProperties"
      :filters="filters"
      :disabled="loading"
      @change="applyFilters"
    />

    <template v-if="loading && !summary">
      <AppSkeleton variant="cards" :count="4" />
      <div class="dashboard-grid dashboard-grid--loading">
        <article class="panel">
          <AppSkeleton variant="chart" />
        </article>
        <article class="panel">
          <AppSkeleton variant="chart" />
        </article>
      </div>
    </template>

    <EmptyState
      v-else-if="error && !summary"
      title="Dashboard data is unavailable"
      :message="error"
      action-label="Try again"
      symbol="!"
      @action="loadDashboard"
    />

    <template v-else>
      <section class="kpi-grid" aria-label="Period summary">
        <KpiCard
          label="Average rating"
          :value="formatRating(summary?.averageRating)"
          :change="formatChange(summary?.absoluteChange)"
          :detail="`Previous period: ${formatRating(summary?.previousAverageRating)}`"
          symbol="★"
          :direction="summary?.direction ?? 'stable'"
        />
        <KpiCard
          label="Total reviews"
          :value="formatNumber(summary?.reviewCount)"
          :detail="`${formatNumber(summary?.previousReviewCount)} in the previous period`"
          symbol="#"
          tone="blue"
        />
        <KpiCard
          label="Positive reviews"
          :value="formatNumber(summary?.sentimentCounts?.positive)"
          :detail="`${formatShare(summary?.sentimentCounts?.positive)} of selected reviews`"
          symbol="+"
          tone="positive"
        />
        <KpiCard
          label="Needs attention"
          :value="formatNumber(summary?.sentimentCounts?.negative)"
          :detail="`${formatShare(summary?.sentimentCounts?.negative)} negative share`"
          symbol="!"
          tone="negative"
          direction="down"
        />
      </section>

      <section class="dashboard-grid">
        <article class="panel panel--wide">
          <div class="panel__header">
            <div>
              <span class="eyebrow">Guest ratings</span>
              <h3>Rating trend</h3>
            </div>
            <div class="legend"><span class="legend__dot legend__dot--primary"></span>Average rating</div>
          </div>
          <AppSkeleton v-if="loading" variant="chart" />
          <RatingTrendChart v-else :points="ratingTrend" />
        </article>

        <article class="panel insight-panel">
          <div class="panel__header">
            <div>
              <span class="eyebrow">Operational focus</span>
              <h3>What needs attention</h3>
            </div>
          </div>
          <template v-if="primaryInsight">
            <div class="insight-stat">
              <strong>{{ primaryInsight.percentage }}%</strong>
              <span>{{ primaryInsight.topic.displayName }} appears most often</span>
            </div>
            <div class="progress">
              <span :style="{ width: `${primaryInsight.percentage}%` }"></span>
            </div>
            <p>{{ primaryInsight.statement }}</p>
            <RouterLink
              class="text-button"
              :to="{ name: 'reviews', query: { sentiment: 'negative', topic: primaryInsight.topic.key } }"
            >
              View related reviews →
            </RouterLink>
          </template>
          <div v-else class="insight-empty">
            <strong>No negative themes detected</strong>
            <p>No operational issue has enough evidence in this period.</p>
          </div>
        </article>
      </section>

      <section class="dashboard-grid dashboard-grid--equal">
        <article class="panel">
          <div class="panel__header">
            <div>
              <span class="eyebrow">Daily mix</span>
              <h3>Sentiment trend</h3>
            </div>
          </div>
          <SentimentTrendChart :points="sentimentTrend" />
        </article>
        <article class="panel">
          <div class="panel__header">
            <div>
              <span class="eyebrow">Recurring themes</span>
              <h3>Topic breakdown</h3>
            </div>
          </div>
          <TopicBreakdownChart :topics="topicBreakdown" />
        </article>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <span class="eyebrow">Portfolio view</span>
            <h3>Property performance</h3>
          </div>
          <RouterLink to="/reviews" class="text-button"> Browse all reviews → </RouterLink>
        </div>
        <div v-if="propertyRatings.length" class="property-table">
          <div class="property-row property-row--head">
            <span>Property</span><span>Rating</span><span>Reviews</span><span>Positive</span
            ><span>Change</span>
          </div>
          <div v-for="property in propertyRatings" :key="property.id" class="property-row">
            <div class="property-name">
              <span>{{ initials(property.name) }}</span>
              <div>
                <strong>{{ property.name }}</strong
                ><small>{{ property.publicLocation ?? 'Portfolio property' }}</small>
              </div>
            </div>
            <strong>{{ formatRating(property.averageRating) }}</strong>
            <span>{{ property.reviewCount }}</span>
            <span>{{ formatPercent(property.positivePercentage) }}</span>
            <span class="metric-change" :class="`metric-change--${property.direction ?? 'stable'}`">
              {{ formatChange(property.absoluteChange) }}
            </span>
          </div>
        </div>
        <EmptyState
          v-else
          title="No property ratings"
          message="No reviews match the current dashboard filters."
          symbol="A"
        />
      </section>
    </template>
  </DashboardLayout>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import AppAlert from '../components/common/AppAlert.vue'
import AppSkeleton from '../components/common/AppSkeleton.vue'
import EmptyState from '../components/common/EmptyState.vue'
import DashboardFilters from '../components/dashboard/DashboardFilters.vue'
import KpiCard from '../components/dashboard/KpiCard.vue'
import RatingTrendChart from '../components/dashboard/RatingTrendChart.vue'
import SentimentTrendChart from '../components/dashboard/SentimentTrendChart.vue'
import TopicBreakdownChart from '../components/dashboard/TopicBreakdownChart.vue'
import { portfolioBrand } from '../config/portfolio-brand.js'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useDashboardStore } from '../stores/dashboard.js'
import { usePropertiesStore } from '../stores/properties.js'

export default {
  name: 'DashboardView',
  components: {
    AppAlert,
    AppSkeleton,
    DashboardFilters,
    DashboardLayout,
    EmptyState,
    KpiCard,
    RatingTrendChart,
    SentimentTrendChart,
    TopicBreakdownChart,
  },
  data() {
    const from = this.$route.query.from
    const to = this.$route.query.to
    const selectedDays =
      from && to
        ? Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86_400_000) + 1
        : null

    return {
      filters: {
        propertyIds: this.$route.query.propertyId ? [this.$route.query.propertyId] : undefined,
        from,
        to,
        period: selectedDays === 30 ? '30-days' : selectedDays === 7 ? '7-days' : 'week',
      },
    }
  },
  computed: {
    ...mapState(useDashboardStore, [
      'summary',
      'propertyRatings',
      'ratingTrend',
      'sentimentTrend',
      'topicBreakdown',
      'insights',
      'loading',
      'error',
      'partial',
    ]),
    ...mapState(usePropertiesStore, { availableProperties: 'properties' }),
    primaryInsight() {
      return this.insights[0] ?? null
    },
    periodLabel() {
      const period = this.summary?.period?.current
      if (!period) return 'Current comparable period'
      return `${this.formatDate(period.from)} – ${this.formatDate(period.to)}`
    },
  },
  async mounted() {
    await this.fetchProperties()
    await this.loadDashboard()
  },
  methods: {
    ...mapActions(useDashboardStore, ['fetchDashboard']),
    ...mapActions(usePropertiesStore, ['fetchProperties']),
    loadDashboard() {
      const params = { ...this.filters }
      delete params.period
      return this.fetchDashboard(params)
    },
    applyFilters(filters) {
      this.filters = filters
      const query = {
        propertyId: filters.propertyIds?.[0],
        from: filters.from,
        to: filters.to,
      }
      this.$router.replace({ query: Object.fromEntries(Object.entries(query).filter(([, value]) => value)) })
      this.loadDashboard()
    },
    formatRating(value) {
      return value === null || value === undefined ? '—' : Number(value).toFixed(1)
    },
    formatNumber(value) {
      if (value === null || value === undefined) return '—'
      return Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-AU') : '—'
    },
    formatPercent(value) {
      return value === null || value === undefined ? '—' : `${value}%`
    },
    formatShare(count) {
      const total = this.summary?.reviewCount
      if (!total && total !== 0) return '—'
      if (total === 0) return '—'
      return `${Math.round((Number(count ?? 0) / total) * 100)}%`
    },
    formatChange(value) {
      if (value === null || value === undefined) return '—'
      const number = Number(value)
      return `${number > 0 ? '+' : ''}${number.toFixed(1)}`
    },
    formatDate(value) {
      return new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${value}T00:00:00`))
    },
    initials(name) {
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
    },
    downloadSummary() {
      const rows = [
        ['Generated by', portfolioBrand.productName],
        ['Developed by', portfolioBrand.creatorName],
        ['Data notice', portfolioBrand.exportNotice],
        [],
        ['Metric', 'Value'],
        ['Average rating', this.formatRating(this.summary.averageRating)],
        ['Previous average', this.formatRating(this.summary.previousAverageRating)],
        ['Total reviews', this.summary.reviewCount],
        ['Positive reviews', this.summary.sentimentCounts.positive],
        ['Negative reviews', this.summary.sentimentCounts.negative],
      ]
      const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
      const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'hospitality-review-intelligence-summary.csv'
      link.click()
      URL.revokeObjectURL(url)
    },
  },
}
</script>
