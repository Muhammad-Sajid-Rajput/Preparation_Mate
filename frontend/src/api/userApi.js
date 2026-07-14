import api from './axiosInstance'

export const getMe = async () => {
  const res = await api.get('/users/me')
  return res.data
}
export const updateMe = async (data) => {
  const res = await api.patch('/users/me', data)
  return res.data
}
export const deleteMe = async () => {
  const res = await api.delete('/users/me')
  return res.data
}
export const updatePassword = async (data) => {
  const res = await api.patch('/users/me/password', data)
  return res.data
}
