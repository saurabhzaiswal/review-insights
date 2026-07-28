<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'sidebar--open': mobileMenuOpen }">
      <div class="brand">
        <div class="brand__mark">A</div>
        <div><strong>Azzurro</strong><span>Review Insights</span></div>
      </div>

      <nav class="sidebar__nav" aria-label="Primary navigation">
        <p class="sidebar__label">Workspace</p>
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" @click="closeMenu">
          <span class="nav-symbol" aria-hidden="true">{{ item.symbol }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="sync-chip"><span></span> Portfolio ready</div>
        <p>Guest feedback is available</p>
      </div>
    </aside>

    <button
      v-if="mobileMenuOpen"
      class="sidebar-backdrop"
      aria-label="Close navigation"
      @click="closeMenu"
    ></button>

    <main class="main-content">
      <header class="topbar">
        <div class="topbar__left">
          <button class="mobile-menu-button" aria-label="Open navigation" @click="mobileMenuOpen = true">
            <span></span><span></span><span></span>
          </button>
          <div>
            <p>Operations workspace</p>
            <h1>{{ title }}</h1>
          </div>
        </div>
        <div class="topbar__right">
          <div class="last-sync">
            <span class="status-dot"></span>
            <div><small>Portfolio update</small><strong>Current data ready</strong></div>
          </div>
          <button class="avatar" aria-label="Open user menu">OP</button>
        </div>
      </header>

      <div class="page-content"><slot /></div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'DashboardLayout',
  props: {
    title: { type: String, required: true },
  },
  data() {
    return {
      mobileMenuOpen: false,
      navigation: [
        { to: '/', label: 'Overview', symbol: '⌂' },
        { to: '/reviews', label: 'Guest reviews', symbol: '★' },
        { to: '/data-health', label: 'Review coverage', symbol: '✓' },
      ],
    }
  },
  methods: {
    closeMenu() {
      this.mobileMenuOpen = false
    },
  },
}
</script>
