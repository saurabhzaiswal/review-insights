<template>
  <div class="empty-state" role="status">
    <span aria-hidden="true">{{ symbol }}</span>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <button v-if="actionLabel" class="button button--secondary" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  emits: ['action'],
  props: {
    title: { type: String, required: true },
    message: { type: String, required: true },
    symbol: { type: String, default: '—' },
    actionLabel: { type: String, default: '' },
  },
}
</script>
