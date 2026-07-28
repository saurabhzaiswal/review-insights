<template>
  <article class="kpi-card">
    <div class="kpi-card__top">
      <span>{{ label }}</span>
      <span class="kpi-card__icon" :class="`kpi-card__icon--${tone}`">{{ symbol }}</span>
    </div>
    <div class="kpi-card__value-row">
      <strong>{{ value }}</strong>
      <span v-if="change" class="metric-change" :class="`metric-change--${direction}`">{{ change }}</span>
    </div>
    <p>{{ detail }}</p>
  </article>
</template>

<script>
export default {
  name: 'KpiCard',
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    detail: { type: String, required: true },
    change: { type: String, default: '' },
    direction: { type: String, default: 'up' },
    symbol: { type: String, default: '•' },
    tone: { type: String, default: 'primary' },
  },
}
</script>
