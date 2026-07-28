<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'sidebar--open': mobileMenuOpen }">
      <RouterLink class="brand" to="/" aria-label="Hospitality Review Intelligence home" @click="closeMenu">
        <div class="brand__mark">HRI</div>
        <div><strong>Hospitality</strong><span>Review Intelligence</span></div>
      </RouterLink>

      <nav class="sidebar__nav" aria-label="Primary navigation">
        <p class="sidebar__label">Workspace</p>
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" @click="closeMenu">
          <span class="nav-symbol" aria-hidden="true">{{ item.symbol }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__footer">
        <div class="sync-chip"><span></span> Portfolio project</div>
        <p>Backend-powered review analytics</p>
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
            <p>Guest analytics workspace</p>
            <h1>{{ title }}</h1>
          </div>
        </div>
        <div class="topbar__right">
          <div class="last-sync">
            <span class="status-dot"></span>
            <div><small>Project dataset</small><strong>Backend data ready</strong></div>
          </div>
          <div ref="profileMenu" class="profile-menu">
            <button
              class="avatar"
              type="button"
              aria-label="Open Saurabh Choudhary's profile links"
              aria-haspopup="true"
              :aria-expanded="profileMenuOpen"
              @click="toggleProfileMenu"
            >
              SC
            </button>

            <Transition name="profile-popover">
              <div v-if="profileMenuOpen" class="profile-popover" role="dialog" aria-label="Creator profile">
                <div class="profile-popover__identity">
                  <span class="profile-popover__avatar" aria-hidden="true">SC</span>
                  <div>
                    <strong>{{ brand.creatorName }}</strong>
                    <small>Full-stack developer</small>
                  </div>
                </div>
                <div class="profile-popover__links">
                  <a
                    :href="brand.portfolioUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="closeProfileMenu"
                  >
                    <span>Portfolio</span>
                    <small>View selected projects</small>
                    <b aria-hidden="true">↗</b>
                  </a>
                  <a
                    :href="brand.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="closeProfileMenu"
                  >
                    <span>GitHub</span>
                    <small>Explore source code</small>
                    <b aria-hidden="true">↗</b>
                  </a>
                  <a
                    :href="brand.linkedinUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="closeProfileMenu"
                  >
                    <span>LinkedIn</span>
                    <small>Connect professionally</small>
                    <b aria-hidden="true">↗</b>
                  </a>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <div class="page-content">
        <slot />
      </div>
      <PortfolioFooter />
    </main>
  </div>
</template>

<script>
import PortfolioFooter from '../components/common/PortfolioFooter.vue'
import { portfolioBrand } from '../config/portfolio-brand.js'

export default {
  name: 'DashboardLayout',
  components: { PortfolioFooter },
  props: {
    title: { type: String, required: true },
  },
  data() {
    return {
      brand: portfolioBrand,
      mobileMenuOpen: false,
      profileMenuOpen: false,
      navigation: [
        { to: '/', label: 'Overview', symbol: 'O' },
        { to: '/reviews', label: 'Guest reviews', symbol: 'R' },
        { to: '/data-health', label: 'Review coverage', symbol: 'C' },
        { to: '/about', label: 'Project info', symbol: 'i' },
      ],
    }
  },
  mounted() {
    document.addEventListener('pointerdown', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('pointerdown', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    closeMenu() {
      this.mobileMenuOpen = false
    },
    toggleProfileMenu() {
      this.profileMenuOpen = !this.profileMenuOpen
    },
    closeProfileMenu() {
      this.profileMenuOpen = false
    },
    handleOutsideClick(event) {
      if (this.profileMenuOpen && !this.$refs.profileMenu?.contains(event.target)) {
        this.closeProfileMenu()
      }
    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeProfileMenu()
      }
    },
  },
}
</script>
