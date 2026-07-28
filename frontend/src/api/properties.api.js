import http from '../axios.js'

export const propertiesApi = {
  list() {
    return http.get('/properties')
  },
}
