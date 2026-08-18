import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageLoader } from '../components/ui/States'
export function ProtectedRoute() { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <PageLoader />; return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
export function PublicOnlyRoute() { const { user, loading } = useAuth(); if (loading) return <PageLoader />; return user ? <Navigate to="/dashboard" replace /> : <Outlet /> }
