<template>
  <div class="topic-chart">
    <div v-if="topics.length" class="topic-chart__canvas">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <ul v-if="topics.length" class="topic-chart__list">
      <li v-for="(topic, index) in visibleTopics" :key="topic.id || topic.key">
        <span :style="{ background: colors[index] }"></span>
        <div>
          <strong>{{ topic.displayName }}</strong
          ><small>{{ topic.reviewCount }} reviews</small>
        </div>
        <b>{{ displayPercent(topic.reviewPercentage) }}</b>
      </li>
    </ul>
    <EmptyState
      v-else
      title="No topics detected"
      message="Operational topics will appear when matching reviews are available."
      symbol="#"
    />
  </div>
</template>

<script>
import { Doughnut } from 'vue-chartjs'
import '../../charts/chart.js'
import EmptyState from '../common/EmptyState.vue'

export default {
  name: 'TopicBreakdownChart',
  components: { Doughnut, EmptyState },
  props: {
    topics: { type: Array, default: () => [] },
  },
  data() {
    return {
      colors: ['#087ea4', '#18b7b0', '#e4b85a', '#2870a6', '#d65454', '#7764a7'],
    }
  },
  computed: {
    visibleTopics() {
      return this.topics.slice(0, 6)
    },
    chartData() {
      return {
        labels: this.visibleTopics.map((topic) => topic.displayName),
        datasets: [
          {
            data: this.visibleTopics.map((topic) => topic.reviewCount),
            backgroundColor: this.colors,
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 4,
          },
        ],
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} reviews`,
            },
          },
        },
      }
    },
  },
  methods: {
    displayPercent(value) {
      return value === null || value === undefined ? '—' : `${value}%`
    },
  },
}
</script>

<style scoped>
.topic-chart {
  min-height: 260px;
  display: grid;
  grid-template-columns: minmax(180px, 0.75fr) minmax(220px, 1fr);
  align-items: center;
  gap: 24px;
}

.topic-chart__canvas {
  height: 220px;
}

.topic-chart__list {
  display: grid;
  gap: 13px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.topic-chart__list li {
  display: grid;
  grid-template-columns: 9px 1fr auto;
  align-items: center;
  gap: 10px;
}

.topic-chart__list li > span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.topic-chart__list div {
  display: grid;
}

.topic-chart__list strong {
  font-size: 12px;
}

.topic-chart__list small {
  color: var(--muted-color);
  font-size: 10px;
}

.topic-chart__list b {
  font-size: 12px;
}

@media (max-width: 650px) {
  .topic-chart {
    grid-template-columns: 1fr;
  }
}
</style>
