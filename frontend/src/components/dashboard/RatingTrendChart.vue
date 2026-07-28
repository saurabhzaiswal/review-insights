<template>
  <div class="chart-frame">
    <Line v-if="points.length" :data="chartData" :options="chartOptions" />
    <EmptyState
      v-else
      title="No rating trend yet"
      message="Ratings will appear here when reviews exist for the selected period."
      symbol="↗"
    />
  </div>
</template>

<script>
import { Line } from 'vue-chartjs'
import '../../charts/chart.js'
import EmptyState from '../common/EmptyState.vue'

export default {
  name: 'RatingTrendChart',
  components: { Line, EmptyState },
  props: {
    points: { type: Array, default: () => [] },
  },
  computed: {
    chartData() {
      return {
        labels: this.points.map((point) => this.shortDate(point.date)),
        datasets: [
          {
            label: 'Average rating',
            data: this.points.map((point) => point.averageRating),
            borderColor: '#087ea4',
            backgroundColor: 'rgba(8, 126, 164, 0.11)',
            pointBackgroundColor: '#e4b85a',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
            fill: true,
            tension: 0.32,
          },
        ],
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              afterLabel: (context) => `${this.points[context.dataIndex]?.reviewCount ?? 0} reviews`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            min: 0,
            max: 10,
            ticks: { stepSize: 2 },
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

.chart-frame :deep(.empty-state) {
  min-height: 260px;
}
</style>
