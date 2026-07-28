import Axios from 'axios'

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
  timeout: 15000,
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiMessage = error?.response?.data?.message
    error.userMessage = Array.isArray(apiMessage)
      ? apiMessage.join(', ')
      : apiMessage || error.message || 'Unable to reach the server'

    return Promise.reject(error)
  },
)

export default axios
