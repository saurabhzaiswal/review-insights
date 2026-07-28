import { defineStore } from 'pinia'
import { propertiesApi } from '../api/properties.api.js'

export const usePropertiesStore = defineStore('properties', {
  state: () => ({
    properties: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchProperties() {
      this.loading = true
      this.error = null

      try {
        const response = await propertiesApi.list()
        this.properties = response.data?.data ?? response.data ?? []
        return this.properties
      } catch (error) {
        this.error = error.userMessage
      } finally {
        this.loading = false
      }
    },
  },
})
