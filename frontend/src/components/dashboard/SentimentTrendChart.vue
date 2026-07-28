<template>
  <div class="chart-frame">
    <Bar v-if="points.length" :data="chartData" :options="chartOptions" />
    <EmptyState
      v-else
      title="No sentiment activity"
      message="Sentiment counts will appear after reviews are available."
      symbol="≋"
    />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import '../../charts/chart.js'
import EmptyState from '../common/EmptyState.vue'

const datasets = [
  ['Positive', 'positive', '#16856a'],
  ['Neutral', 'neutral', '#e4b85a'],
  ['Negative', 'negative', '#d65454'],
]

export default {
  name: 'SentimentTrendChart',
  components: { Bar, EmptyState },
  props: {
    points: { type: Array, default: () => [] },
  },
  computed: {
    chartData() {
      return {
        labels: this.points.map((point) => this.shortDate(point.date)),
        datasets: datasets.map(([label, key, color]) => ({
          label,
          data: this.points.map((point) => point[key] ?? 0),
          backgroundColor: color,
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 28,
        })),
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, boxWidth: 8, padding: 18 },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, border: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 },
            border: { display: false },
            grid: { color: '#e3edf1' },
          },
        },
      }
    },
  },
  methods: {
    shortDate(value) {
      return new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${value}T00:00:00`))
    },
  },
}
</script>

<style scoped>
.chart-frame {
  height: 260px;
}
</style>
