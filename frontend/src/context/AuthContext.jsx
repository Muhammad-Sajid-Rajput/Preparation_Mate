import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import * as authApi from '../api/authApi'
import { handleApiError } from '../utils/handleApiError'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken, removeToken] = useLocalStorage('pm_token', null)
  const [user,  setUser,  removeUser]  = useLocalStorage('pm_user',  null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!token && !!user

  useEffect(() => {
    const validateToken = async () => {
      if (!token) { setIsLoading(false); return }
      try {
        const user = await authApi.getMe()
        setUser(user)
      } catch {
        removeToken()
        removeUser()
      } finally {
        setIsLoading(false)
      }
    }
    validateToken()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const { accessToken, user } = await authApi.login(email, password)
      setToken(accessToken)
      setUser(user)
      return { success: true }
    } catch (err) {
      return { success: false, ...handleApiError(err) }
    }
  }, [])

  const register = useCallback(async (formData) => {
    try {
      const res = await authApi.register(formData)
      // register returns only { userId } — no token issued until email verified
      return { success: true, data: res.data }
    } catch (err) {
      return { success: false, ...handleApiError(err) }
    }
  }, [])

  const verifyEmail = useCallback(async (email, otp) => {
    try {
      const res = await authApi.verifyEmail(email, otp)
      // Axios interceptor already unwraps the { success, data } envelope,
      // so res is the payload directly: { accessToken, user }
      setToken(res.accessToken)
      setUser(res.user)
      return { success: true }
    } catch (err) {
      return { success: false, ...handleApiError(err) }
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}  // clear server-side refresh token cookie
    removeToken()
    removeUser()
    window.location.href = '/login'
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.getMe()
      setUser(freshUser)
      return freshUser
    } catch (err) {
      console.error("Failed to refresh user:", err)
    }
  }, [setUser])

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      verifyEmail,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
