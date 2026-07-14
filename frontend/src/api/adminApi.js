import api from './axiosInstance'

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats')
  return res.data
}

export const getMetrics = async () => {
  const res = await api.get('/admin/metrics')
  return res.data
}

export const getApiUsage = async (days = 7) => {
  const res = await api.get(`/admin/api-usage?days=${days}`)
  return res.data
}

export const getErrorLogs = async (page = 1) => {
  const res = await api.get(`/admin/errors?page=${page}&limit=20`)
  return res.data
}

export const getAdminUsers = async (page = 1, search = '') => {
  const res = await api.get(
    `/admin/users?page=${page}&limit=20&search=${search}`
  )
  return res.data
}

export const updateAdminUser = async (id, data) => {
  const res = await api.patch(`/admin/users/${id}`, data)
  return res.data
}
