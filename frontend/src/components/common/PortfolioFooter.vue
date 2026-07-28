<template>
  <footer class="portfolio-footer">
    <div class="portfolio-footer__main">
      <div>
        <strong>Designed and developed by {{ brand.creatorName }}</strong>
        <!-- <p>{{ brand.disclaimer }}</p> -->
      </div>
      <nav aria-label="Creator links">
        <a :href="brand.portfolioUrl" target="_blank" rel="noopener noreferrer">Portfolio</a>
        <a :href="brand.githubUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a :href="brand.linkedinUrl" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </nav>
    </div>
  </footer>
</template>

<script>
import { portfolioBrand } from '../../config/portfolio-brand.js'

export default {
  name: 'PortfolioFooter',
  data() {
    return { brand: portfolioBrand }
  },
}
</script>
