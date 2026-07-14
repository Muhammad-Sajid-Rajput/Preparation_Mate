import axios from 'axios'
import { APP_CONFIG } from '../config/app.config'

const api = axios.create({
  baseURL:  APP_CONFIG.apiBaseUrl,
  timeout:  APP_CONFIG.apiTimeout,
  headers:  { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('pm_token')
    const token = raw ? JSON.parse(raw) : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

// Recursive helper to ensure 'id' property is populated from '_id' for any Mongoose objects
const mapMongoIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(mapMongoIds)
  }
  if (obj._id && !obj.id) {
    obj.id = String(obj._id)
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] && typeof obj[key] === 'object') {
      obj[key] = mapMongoIds(obj[key])
    }
  }
  return obj
}

api.interceptors.response.use(
  (response) => {
    // Auto-unwrap the standard { success, data } envelope.
    // Every backend route responds with { success: true, data: <payload> }.
    // Returning response.data.data lets every API function just do:
    //   const res = await api.get(...)   →   res.data === the actual payload
    if (response.data && 'data' in response.data) {
      response.data = mapMongoIds(response.data.data)
    } else if (response.data) {
      response.data = mapMongoIds(response.data)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pm_token')
      localStorage.removeItem('pm_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
