<template>
  <section class="review-list" aria-label="Review list" aria-live="polite">
    <AppSkeleton v-if="loading && !reviews.length" :count="4" />
    <EmptyState
      v-else-if="error && !reviews.length"
      title="Reviews could not be loaded"
      :message="error"
      action-label="Try again"
      symbol="!"
      @action="$emit('retry')"
    />
    <EmptyState
      v-else-if="!reviews.length"
      title="No matching reviews"
      message="Try widening the date range or clearing one of the filters."
      action-label="Clear filters"
      symbol="0"
      @action="$emit('clear')"
    />
    <template v-else>
      <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />
      <button
        v-if="pagination?.hasNextPage"
        class="button button--secondary button--full"
        :disabled="loading"
        @click="$emit('load-more')"
      >
        {{ loading ? 'Loading more…' : 'Load more reviews' }}
      </button>
      <p v-else class="review-list__end">
        Showing all {{ pagination?.total ?? reviews.length }} matching reviews
      </p>
    </template>
  </section>
</template>

<script>
import AppSkeleton from '../common/AppSkeleton.vue'
import EmptyState from '../common/EmptyState.vue'
import ReviewCard from './ReviewCard.vue'

export default {
  name: 'ReviewFeed',
  components: { AppSkeleton, EmptyState, ReviewCard },
  props: {
    reviews: { type: Array, default: () => [] },
    pagination: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
  },
  emits: ['clear', 'load-more', 'retry'],
}
</script>
