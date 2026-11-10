import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedUserRoute() {
  const { isAuthenticated, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand-dark text-white">
        Loading…
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export function ProtectedAdminRoute() {
  const { isAuthenticated, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-brand-text">
        Loading admin…
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading, isAdmin } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
  return <Outlet />
}
