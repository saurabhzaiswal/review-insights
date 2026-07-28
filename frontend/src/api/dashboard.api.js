import http from '../axios.js'
import { compactParams } from './params.js'

export const dashboardApi = {
  overview(params) {
    return http.get('/dashboard/overview', { params: compactParams(params) })
  },
  propertyRatings(params) {
    return http.get('/analytics/property-ratings', { params: compactParams(params) })
  },
  ratingTrend(params) {
    return http.get('/analytics/rating-trend', { params: compactParams(params) })
  },
  sentimentTrend(params) {
    return http.get('/analytics/sentiment-trend', { params: compactParams(params) })
  },
  topics(params) {
    return http.get('/analytics/topics', { params: compactParams(params) })
  },
  insights(params) {
    return http.get('/insights', { params: compactParams(params) })
  },
}
