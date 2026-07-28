<template>
  <Analytics />
  <RouterView />
</template>

<script>
import { Analytics } from '@vercel/analytics/vue'
export default {
  name: 'App',
  components: {
    Analytics,
  },
}
</script>
