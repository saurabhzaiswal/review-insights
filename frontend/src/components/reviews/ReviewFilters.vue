<template>
  <form class="review-toolbar" @submit.prevent="emitChange">
    <div class="review-toolbar__top">
      <div class="review-search">
        <label for="review-search">Search feedback</label>
        <div class="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            id="review-search"
            v-model="local.search"
            type="search"
            placeholder="Guest name, comment, or issue"
            @input="scheduleChange"
          />
        </div>
      </div>
      <button type="button" class="button button--ghost" @click="reset">Clear all</button>
    </div>

    <div class="review-toolbar__grid">
      <div class="review-filter-field">
        <label for="review-property">Hotel</label>
        <VSelect
          :model-value="local.propertyId"
          input-id="review-property"
          :options="propertyOptions"
          :reduce="(option) => option.value"
          :clearable="false"
          :searchable="false"
          @update:model-value="update('propertyId', $event)"
        />
      </div>

      <div class="review-filter-field">
        <label for="review-sentiment">Guest sentiment</label>
        <VSelect
          :model-value="local.sentiment"
          input-id="review-sentiment"
          :options="sentimentOptions"
          :reduce="(option) => option.value"
          :clearable="false"
          :searchable="false"
          @update:model-value="update('sentiment', $event)"
        />
      </div>

      <div class="review-filter-field">
        <label for="review-topic">Topic</label>
        <VSelect
          :model-value="local.topic"
          input-id="review-topic"
          :options="topicOptions"
          :reduce="(option) => option.value"
          :clearable="false"
          :searchable="false"
          @update:model-value="update('topic', $event)"
        />
      </div>

      <div class="review-filter-field">
        <label for="review-rating">Rating</label>
        <VSelect
          :model-value="local.ratingRange"
          input-id="review-rating"
          :options="ratingOptions"
          :reduce="(option) => option.value"
          :clearable="false"
          :searchable="false"
          @update:model-value="updateRating"
        />
      </div>

      <div class="review-filter-field review-filter-field--date">
        <label for="review-from">From date</label>
        <input id="review-from" v-model="local.from" type="date" @change="emitChange" />
      </div>

      <div class="review-filter-field review-filter-field--date">
        <label for="review-to">To date</label>
        <input id="review-to" v-model="local.to" type="date" @change="emitChange" />
      </div>

      <div class="review-filter-field">
        <label for="review-sort">Show first</label>
        <VSelect
          :model-value="local.sort"
          input-id="review-sort"
          :options="sortOptions"
          :reduce="(option) => option.value"
          :clearable="false"
          :searchable="false"
          @update:model-value="update('sort', $event)"
        />
      </div>
    </div>
  </form>
</template>

<script>
const RATING_RANGES = {
  all: { minRating: null, maxRating: null },
  excellent: { minRating: 9, maxRating: 10 },
  positive: { minRating: 8, maxRating: 10 },
  neutral: { minRating: 6, maxRating: 7.9 },
  attention: { minRating: 0, maxRating: 5.9 },
}

function selectedRatingRange(filters) {
  const match = Object.entries(RATING_RANGES).find(
    ([, range]) => range.minRating === filters.minRating && range.maxRating === filters.maxRating,
  )

  return match?.[0] ?? 'all'
}

export default {
  name: 'ReviewFilters',
  props: {
    filters: { type: Object, required: true },
    properties: { type: Array, default: () => [] },
    topics: { type: Array, default: () => [] },
  },
  emits: ['change', 'reset'],
  data() {
    return {
      debounceTimer: null,
      local: {
        ...this.filters,
        ratingRange: selectedRatingRange(this.filters),
      },
      sentimentOptions: [
        { label: 'All sentiment', value: null },
        { label: 'Positive', value: 'positive' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Negative', value: 'negative' },
      ],
      ratingOptions: [
        { label: 'All ratings', value: 'all' },
        { label: '9–10 Excellent', value: 'excellent' },
        { label: '8–10 Positive', value: 'positive' },
        { label: '6–7.9 Mixed', value: 'neutral' },
        { label: 'Below 6 Needs attention', value: 'attention' },
      ],
      sortOptions: [
        { label: 'Newest reviews', value: 'latest' },
        { label: 'Oldest reviews', value: 'oldest' },
        { label: 'Lowest ratings', value: 'lowest' },
      ],
    }
  },
  computed: {
    propertyOptions() {
      return [
        { label: 'All hotels', value: null },
        ...this.properties.map((property) => ({ label: property.name, value: property.id })),
      ]
    },
    topicOptions() {
      return [
        { label: 'All topics', value: null },
        ...this.topics.map((topic) => ({ label: topic.displayName, value: topic.key })),
      ]
    },
  },
  watch: {
    filters: {
      deep: true,
      handler(value) {
        this.local = {
          ...value,
          ratingRange: selectedRatingRange(value),
        }
      },
    },
  },
  beforeUnmount() {
    window.clearTimeout(this.debounceTimer)
  },
  methods: {
    update(key, value) {
      this.local[key] = value
      this.emitChange()
    },
    updateRating(value) {
      this.local.ratingRange = value
      Object.assign(this.local, RATING_RANGES[value] ?? RATING_RANGES.all)
      this.emitChange()
    },
    scheduleChange() {
      window.clearTimeout(this.debounceTimer)
      this.debounceTimer = window.setTimeout(this.emitChange, 350)
    },
    emitChange() {
      // ratingRange is presentation-only; the API receives its numeric bounds.
      const filters = { ...this.local }
      delete filters.ratingRange
      this.$emit('change', { ...filters, page: 1 })
    },
    reset() {
      this.local = {
        ...this.filters,
        page: 1,
        propertyId: null,
        from: null,
        to: null,
        sentiment: null,
        topic: null,
        minRating: null,
        maxRating: null,
        ratingRange: 'all',
        search: '',
        sort: 'latest',
      }
      this.$emit('reset')
    },
  },
}
</script>
