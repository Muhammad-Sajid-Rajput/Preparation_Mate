import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const FullScreenLoader = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: '#0A1929',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid rgba(165,192,224,0.15)',
      borderTop: '3px solid #A5C0E0',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
  </div>
)

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export default ProtectedRoute
