<template>
  <span class="status-badge" :class="`status-badge--${tone}`">
    <span v-if="dot" class="status-badge__dot"></span>{{ label }}
  </span>
</template>

<script>
export default {
  name: 'StatusBadge',
  props: {
    label: { type: String, required: true },
    tone: { type: String, default: 'neutral' },
    dot: { type: Boolean, default: false },
  },
}
</script>
