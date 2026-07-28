import http from '../axios.js'
import { compactParams } from './params.js'

export const reviewsApi = {
  list(params) {
    return http.get('/reviews', { params: compactParams(params) })
  },
  findById(id) {
    return http.get(`/reviews/${encodeURIComponent(id)}`)
  },
}
