// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = window.__aura_admin_token__
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config

    // Don't retry refresh or login endpoints
    if (orig.url?.includes('/admin-auth/refresh') || orig.url?.includes('/admin-auth/login')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig) })
      }

      orig._retry  = true
      isRefreshing = true

      try {
        const res   = await api.post('/admin-auth/refresh')
        const token = res.data.accessToken
        window.__aura_admin_token__ = token
        processQueue(null, token)
        orig.headers.Authorization = `Bearer ${token}`
        return api(orig)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        window.__aura_admin_token__ = null
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api