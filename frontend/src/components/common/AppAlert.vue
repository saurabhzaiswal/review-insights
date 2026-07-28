<template>
  <div class="app-alert" :class="`app-alert--${tone}`" role="status">
    <span class="app-alert__icon" aria-hidden="true">{{ tone === 'warning' ? '!' : 'i' }}</span>
    <div>
      <strong>{{ title }}</strong>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAlert',
  props: {
    title: { type: String, required: true },
    message: { type: String, required: true },
    tone: { type: String, default: 'info' },
  },
}
</script>
