import http from '../axios.js'

export const scraperApi = {
  async status() {
    const [status, runs] = await Promise.all([http.get('/scraper/status'), http.get('/scraper/runs')])
    return { status: status.data, runs: runs.data?.data ?? runs.data ?? [] }
  },
  sync(propertyIds) {
    return http.post('/scraper/sync', { propertyIds })
  },
}
