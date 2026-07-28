import { defineStore } from 'pinia'
import { dashboardApi } from '../api/dashboard.api.js'
import { presentProperty } from '../utils/portfolio-presentation.js'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    propertyRatings: [],
    ratingTrend: [],
    sentimentTrend: [],
    topicBreakdown: [],
    insights: [],
    insightMeta: null,
    loading: false,
    error: null,
    partial: false,
    sectionErrors: {},
    lastFetchedAt: null,
  }),

  actions: {
    async fetchDashboard(params = {}) {
      this.loading = true
      this.error = null
      this.partial = false
      this.sectionErrors = {}

      const requests = {
        summary: dashboardApi.overview(params),
        propertyRatings: dashboardApi.propertyRatings(params),
        ratingTrend: dashboardApi.ratingTrend(params),
        sentimentTrend: dashboardApi.sentimentTrend(params),
        topicBreakdown: dashboardApi.topics(params),
        insights: dashboardApi.insights(params),
      }
      const keys = Object.keys(requests)
      const results = await Promise.allSettled(Object.values(requests))
      let successCount = 0

      results.forEach((result, index) => {
        const key = keys[index]
        if (result.status === 'fulfilled') {
          successCount += 1
          if (key === 'insights') {
            this.insights = result.value.data?.insights ?? []
            this.insightMeta = result.value.data ?? null
          } else if (key === 'propertyRatings') {
            this.propertyRatings = (result.value.data ?? []).map(presentProperty)
          } else {
            this[key] = result.value.data ?? []
          }
          return
        }
        this.sectionErrors[key] = result.reason?.userMessage ?? 'This section is unavailable.'
      })

      this.partial = successCount > 0 && successCount < keys.length
      this.error = successCount === 0 ? 'Dashboard data could not be loaded.' : null
      this.lastFetchedAt = successCount > 0 ? new Date().toISOString() : this.lastFetchedAt
      this.loading = false
    },
  },
})
