<template>
  <article class="review-card">
    <div class="review-card__rating" :class="`review-card__rating--${review.sentiment}`">
      {{ formatRating(review.rating) }}
    </div>
    <div class="review-card__content">
      <div class="review-card__header">
        <div>
          <div class="review-card__meta">
            <strong>{{ review.property?.name ?? 'Portfolio Property' }}</strong>
            <span>•</span>
            <time :datetime="review.reviewDate">{{ formatDate(review.reviewDate) }}</time>
          </div>
          <h3>{{ review.title || 'Guest review' }}</h3>
        </div>
        <StatusBadge :label="review.sentiment" :tone="review.sentiment" dot />
      </div>

      <p v-if="review.reviewText" class="review-card__summary">
        {{ review.reviewText }}
      </p>
      <div v-if="review.positiveComment || review.negativeComment" class="review-card__comments">
        <p v-if="review.positiveComment" class="review-comment review-comment--positive">
          <span aria-hidden="true">+</span>{{ review.positiveComment }}
        </p>
        <p v-if="review.negativeComment" class="review-comment review-comment--negative">
          <span aria-hidden="true">−</span>{{ review.negativeComment }}
        </p>
      </div>

      <div class="review-card__footer">
        <div class="topic-list">
          <span v-for="topic in review.topics" :key="topic.id || topic.key">
            {{ topic.displayName }}
          </span>
        </div>
        <span v-if="review.reviewerName" class="reviewer">
          {{ review.reviewerName
          }}<template v-if="review.reviewerCountry"> · {{ review.reviewerCountry }}</template>
        </span>
      </div>
    </div>
  </article>
</template>

<script>
import StatusBadge from '../common/StatusBadge.vue'

export default {
  name: 'ReviewCard',
  components: { StatusBadge },
  props: { review: { type: Object, required: true } },
  methods: {
    formatRating(value) {
      return Number(value).toFixed(1)
    },
    formatDate(value) {
      if (!value) return 'Date unavailable'
      return new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T00:00:00`))
    },
  },
}
</script>
