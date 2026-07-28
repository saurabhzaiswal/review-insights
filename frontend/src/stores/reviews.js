import { defineStore } from 'pinia'
import { reviewsApi } from '../api/reviews.api.js'

export const useReviewsStore = defineStore('reviews', {
  state: () => ({
    reviews: [],
    selectedReview: null,
    pagination: null,
    filters: {
      page: 1,
      limit: 20,
      propertyId: null,
      from: null,
      to: null,
      sentiment: null,
      topic: null,
      minRating: null,
      maxRating: null,
      search: '',
      sort: 'latest',
    },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchReviews({ append = false } = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await reviewsApi.list(this.filters)
        const reviews = response.data?.data ?? response.data ?? []
        this.reviews = append ? [...this.reviews, ...reviews] : reviews
        this.pagination = response.data?.pagination ?? null
        return response.data
      } catch (error) {
        this.error = error.userMessage
      } finally {
        this.loading = false
      }
    },

    async loadMore() {
      if (!this.pagination?.hasNextPage || this.loading) return
      this.filters.page += 1
      await this.fetchReviews({ append: true })
    },

    async fetchReview(id) {
      const response = await reviewsApi.findById(id)
      this.selectedReview = response.data
      return response.data
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters, page: filters.page ?? 1 }
    },

    resetFilters() {
      this.filters = {
        page: 1,
        limit: 20,
        propertyId: null,
        from: null,
        to: null,
        sentiment: null,
        topic: null,
        minRating: null,
        maxRating: null,
        search: '',
        sort: 'latest',
      }
    },
  },
})
