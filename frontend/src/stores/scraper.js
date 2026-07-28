import { defineStore } from 'pinia'
import { scraperApi } from '../api/scraper.api.js'

export const useScraperStore = defineStore('scraper', {
  state: () => ({
    status: null,
    runs: [],
    loading: false,
    syncing: false,
    error: null,
  }),

  actions: {
    async fetchStatus() {
      this.loading = true
      this.error = null

      try {
        const response = await scraperApi.status()
        this.status = response.status
        this.runs = response.runs
      } catch (error) {
        this.error = error.userMessage
      } finally {
        this.loading = false
      }
    },

    async startSync(propertyIds) {
      this.syncing = true
      this.error = null
      try {
        const response = await scraperApi.sync(propertyIds)
        return response.data
      } catch (error) {
        this.error = error.userMessage
        throw error
      } finally {
        this.syncing = false
      }
    },
  },
})
