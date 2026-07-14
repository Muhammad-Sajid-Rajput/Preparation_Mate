import api from './axiosInstance'

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}
export const register = async (data) => {
  const res = await api.post('/auth/register', data)
  return res.data
}
export const checkEmail = async (email) => {
  const res = await api.post('/auth/check-email', { email })
  return res.data
}
export const verifyEmail = async (email, otp) => {
  const res = await api.post('/auth/verify-email', { email, otp })
  return res.data
}
export const resendOtp = async (email) => {
  const res = await api.post('/auth/resend-otp', { email })
  return res.data
}
export const logout = async () => {
  await api.post('/auth/logout')
}
export const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}
export const validateResetToken = async (token) => {
  const res = await api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
  return res.data
}
export const resetPassword = async (token, newPassword) => {
  const res = await api.post('/auth/reset-password', { token, newPassword })
  return res.data
}
export const getMe = async () => {
  const res = await api.get('/users/me')
  return res.data
}
export const updateProfile = async (data) => {
  const res = await api.put('/auth/profile', data)
  return res.data
}
export const changePassword = async (data) => {
  const res = await api.put('/auth/change-password', data)
  return res.data
}
export const deleteAccount = async () => {
  const res = await api.delete('/auth/account')
  return res.data
}
