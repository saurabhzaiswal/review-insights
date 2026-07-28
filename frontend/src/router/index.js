import { createRouter, createWebHistory } from 'vue-router'
import { portfolioBrand } from '../config/portfolio-brand.js'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    meta: { title: 'Overview' },
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/reviews',
    name: 'reviews',
    meta: { title: 'Guest Reviews' },
    component: () => import('../views/ReviewsView.vue'),
  },
  {
    path: '/data-health',
    name: 'data-health',
    meta: { title: 'Review Coverage' },
    component: () => import('../views/DataHealthView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    meta: { title: 'Project Information' },
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} | ${portfolioBrand.productName}`
    : `${portfolioBrand.productName} | ${portfolioBrand.creatorName}`
})

export default router
