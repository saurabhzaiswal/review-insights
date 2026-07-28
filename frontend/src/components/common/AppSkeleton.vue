<template>
  <div class="skeleton animate-pulse" :class="`skeleton--${variant}`" aria-hidden="true">
    <template v-if="variant === 'cards'">
      <div v-for="item in count" :key="item" class="skeleton-card">
        <span class="skeleton-line skeleton-line--short"></span>
        <span class="skeleton-line skeleton-line--value"></span>
        <span class="skeleton-line"></span>
      </div>
    </template>
    <template v-else-if="variant === 'chart'">
      <span class="skeleton-line skeleton-line--short"></span>
      <div class="skeleton-chart">
        <span v-for="bar in 7" :key="bar" :style="{ height: `${28 + bar * 7}%` }"></span>
      </div>
    </template>
    <template v-else>
      <div v-for="item in count" :key="item" class="skeleton-row">
        <span class="skeleton-avatar"></span>
        <div>
          <span class="skeleton-line skeleton-line--medium"></span>
          <span class="skeleton-line"></span>
          <span class="skeleton-line skeleton-line--long"></span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'AppSkeleton',
  props: {
    variant: { type: String, default: 'rows' },
    count: { type: Number, default: 3 },
  },
}
</script>

<style scoped>
.skeleton {
  width: 100%;
}

.skeleton--cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.skeleton-card,
.skeleton-row {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--surface-color);
}

.skeleton-card {
  min-height: 142px;
  padding: 20px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 15px;
  margin-bottom: 12px;
  padding: 18px;
}

.skeleton-row > div {
  display: grid;
  gap: 10px;
}

.skeleton-line,
.skeleton-avatar,
.skeleton-chart span {
  display: block;
  border-radius: 7px;
  background: linear-gradient(90deg, #edf1ef 25%, #f8faf9 50%, #edf1ef 75%);
  background-size: 220% 100%;
  animation: shimmer 1.35s ease-in-out infinite;
}

.skeleton-line {
  width: 100%;
  height: 11px;
  margin-bottom: 14px;
}

.skeleton-line--short {
  width: 36%;
}

.skeleton-line--medium {
  width: 52%;
}

.skeleton-line--long {
  width: 82%;
}

.skeleton-line--value {
  width: 28%;
  height: 31px;
  margin: 16px 0;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.skeleton-chart {
  height: 230px;
  display: flex;
  align-items: flex-end;
  gap: 7%;
  padding: 25px 5% 0;
}

.skeleton-chart span {
  flex: 1;
  min-height: 34px;
  border-radius: 8px 8px 3px 3px;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-chart span {
    animation: none;
  }
}

@media (max-width: 850px) {
  .skeleton--cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .skeleton--cards {
    grid-template-columns: 1fr;
  }
}
</style>
