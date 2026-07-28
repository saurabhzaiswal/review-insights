<template>
  <DashboardLayout title="Guest feedback">
    <section class="page-intro">
      <div>
        <span class="eyebrow">{{ resultLabel }}</span>
        <h2>What guests are saying</h2>
        <p>Find feedback by hotel, topic, date, or guest sentiment.</p>
      </div>
      <button class="button button--secondary" :disabled="!reviews.length" @click="exportReviews">
        Download results
      </button>
    </section>

    <AppAlert
      v-if="pagination?.total > 0 && pagination.total < 5"
      tone="warning"
      title="Small result set"
      message="Patterns in fewer than five reviews may not represent the broader guest experience."
    />

    <ReviewFilters
      :filters="filters"
      :properties="availableProperties"
      :topics="topics"
      @change="applyFilters"
      @reset="clearFilters"
    />

    <div class="review-layout">
      <ReviewFeed
        :reviews="reviews"
        :pagination="pagination"
        :loading="loading"
        :error="error"
        @clear="clearFilters"
        @load-more="loadMore"
        @retry="refresh"
      />

      <aside class="panel topic-summary">
        <div class="panel__header">
          <div>
            <span class="eyebrow">Selected period</span>
            <h3>Top topics</h3>
          </div>
        </div>
        <AppSkeleton v-if="topicsLoading" :count="4" />
        <EmptyState v-else-if="topicError" title="Topics unavailable" :message="topicError" symbol="!" />
        <EmptyState
          v-else-if="!topics.length"
          title="No topics yet"
          message="No operational topics match the current date and property filters."
          symbol="#"
        />
        <div v-else>
          <div v-for="topic in topics.slice(0, 8)" :key="topic.id" class="topic-row">
            <div>
              <span>{{ topic.displayName }}</span>
              <strong>{{ topic.reviewCount }}</strong>
            </div>
            <div class="progress">
              <span :style="{ width: `${topic.reviewPercentage ?? 0}%` }"></span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </DashboardLayout>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { dashboardApi } from '../api/dashboard.api.js'
import AppAlert from '../components/common/AppAlert.vue'
import AppSkeleton from '../components/common/AppSkeleton.vue'
import EmptyState from '../components/common/EmptyState.vue'
import ReviewFeed from '../components/reviews/ReviewFeed.vue'
import ReviewFilters from '../components/reviews/ReviewFilters.vue'
import { portfolioBrand } from '../config/portfolio-brand.js'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { usePropertiesStore } from '../stores/properties.js'
import { useReviewsStore } from '../stores/reviews.js'

const queryFilterKeys = [
  'propertyId',
  'from',
  'to',
  'sentiment',
  'topic',
  'minRating',
  'maxRating',
  'search',
  'sort',
]

export default {
  name: 'ReviewsView',
  components: {
    AppAlert,
    AppSkeleton,
    DashboardLayout,
    EmptyState,
    ReviewFeed,
    ReviewFilters,
  },
  data() {
    return {
      topics: [],
      topicsLoading: false,
      topicError: null,
    }
  },
  computed: {
    ...mapState(useReviewsStore, ['reviews', 'pagination', 'filters', 'loading', 'error']),
    ...mapState(usePropertiesStore, { availableProperties: 'properties' }),
    resultLabel() {
      if (this.loading && !this.pagination) return 'Loading reviews'
      const count = this.pagination?.total ?? 0
      return `${count.toLocaleString('en-AU')} matching ${count === 1 ? 'review' : 'reviews'}`
    },
  },
  async mounted() {
    const routeFilters = Object.fromEntries(
      queryFilterKeys
        .filter((key) => this.$route.query[key])
        .map((key) => [
          key,
          ['minRating', 'maxRating'].includes(key) ? Number(this.$route.query[key]) : this.$route.query[key],
        ]),
    )
    this.setFilters(routeFilters)
    await this.fetchProperties()
    await this.refresh()
  },
  methods: {
    ...mapActions(useReviewsStore, ['fetchReviews', 'loadMore', 'resetFilters', 'setFilters']),
    ...mapActions(usePropertiesStore, ['fetchProperties']),
    async refresh() {
      await Promise.all([this.fetchReviews(), this.fetchTopics()])
    },
    async fetchTopics() {
      this.topicsLoading = true
      this.topicError = null
      try {
        const hasCompleteRange = this.filters.from && this.filters.to
        const response = await dashboardApi.topics({
          propertyIds: this.filters.propertyId ? [this.filters.propertyId] : undefined,
          from: hasCompleteRange ? this.filters.from : undefined,
          to: hasCompleteRange ? this.filters.to : undefined,
        })
        this.topics = response.data ?? []
      } catch (error) {
        this.topicError = error.userMessage
      } finally {
        this.topicsLoading = false
      }
    },
    applyFilters(filters) {
      this.setFilters(filters)
      this.syncQuery()
      this.refresh()
    },
    clearFilters() {
      this.resetFilters()
      this.$router.replace({ query: {} })
      this.refresh()
    },
    syncQuery() {
      const query = Object.fromEntries(
        queryFilterKeys
          .map((key) => [key, this.filters[key]])
          .filter(([, value]) => value !== null && value !== undefined && value !== ''),
      )
      this.$router.replace({ query })
    },
    exportReviews() {
      const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
      const rows = [
        ['Generated by', portfolioBrand.productName],
        ['Developed by', portfolioBrand.creatorName],
        ['Data notice', portfolioBrand.exportNotice],
        [],
        ['Property', 'Rating', 'Date', 'Sentiment', 'Title', 'Review'],
        ...this.reviews.map((review) => [
          review.property?.name,
          review.rating,
          review.reviewDate,
          review.sentiment,
          review.title,
          review.reviewText || review.positiveComment || review.negativeComment,
        ]),
      ]
      const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'hospitality-review-intelligence-reviews.csv'
      link.click()
      URL.revokeObjectURL(url)
    },
  },
}
</script>
