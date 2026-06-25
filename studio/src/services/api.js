// studio/src/services/api.js
// The auth system uses Bearer tokens in memory + a refreshToken httpOnly cookie.
// Studio calls /auth/refresh on load to get a fresh access token using the cookie
// that was set when the user logged in on the client (shared on localhost).
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,   // sends the refreshToken cookie
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request if available
api.interceptors.request.use(config => {
  const token = window.__studio_access_token__
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api