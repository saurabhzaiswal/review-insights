<template>
  <div class="filter-bar dashboard-filter-bar" aria-label="Dashboard filters">
    <div class="dashboard-filter-bar__intro">
      <span>View</span>
      <strong>Refine results</strong>
    </div>
    <div class="filter-field filter-field--property">
      <label for="dashboard-property">Hotel</label>
      <VSelect
        :model-value="propertyId"
        input-id="dashboard-property"
        :options="propertyOptions"
        :reduce="(option) => option.value"
        :clearable="false"
        :searchable="propertyOptions.length > 6"
        :disabled="disabled"
        @update:model-value="updateProperty"
      />
    </div>
    <div class="filter-field">
      <label for="dashboard-period">Time period</label>
      <VSelect
        :model-value="period"
        input-id="dashboard-period"
        :options="periodOptions"
        :reduce="(option) => option.value"
        :clearable="false"
        :searchable="false"
        :disabled="disabled"
        @update:model-value="updatePeriod"
      />
    </div>
    <button class="button button--ghost" :disabled="disabled || isDefault" @click="reset">Clear</button>
  </div>
</template>

<script>
export default {
  name: 'DashboardFilters',
  props: {
    properties: { type: Array, default: () => [] },
    filters: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['change'],
  data() {
    return {
      propertyId: this.filters.propertyIds?.[0] ?? null,
      period: this.filters.period ?? 'week',
      periodOptions: [
        { label: 'This week', value: 'week' },
        { label: 'Last 7 days', value: '7-days' },
        { label: 'Last 30 days', value: '30-days' },
      ],
    }
  },
  computed: {
    propertyOptions() {
      return [
        { label: 'All properties', value: null },
        ...this.properties.map((property) => ({
          label: property.name,
          value: property.id,
        })),
      ]
    },
    isDefault() {
      return !this.propertyId && this.period === 'week'
    },
  },
  methods: {
    updateProperty(value) {
      this.propertyId = value
      this.emitChange()
    },
    updatePeriod(value) {
      this.period = value
      this.emitChange()
    },
    emitChange() {
      const dates = this.periodDates(this.period)
      this.$emit('change', {
        propertyIds: this.propertyId ? [this.propertyId] : undefined,
        period: this.period,
        ...dates,
      })
    },
    periodDates(period) {
      if (period === 'week') return { from: undefined, to: undefined }
      const numberOfDays = period === '30-days' ? 30 : 7
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - numberOfDays + 1)
      const dateOnly = (date) => date.toISOString().slice(0, 10)
      return { from: dateOnly(from), to: dateOnly(to) }
    },
    reset() {
      this.propertyId = null
      this.period = 'week'
      this.emitChange()
    },
  },
}
</script>
