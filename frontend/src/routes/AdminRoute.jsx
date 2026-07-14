import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}

export default AdminRoute
