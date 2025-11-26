import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token')

  if (!token) {
    // Redireciona para login se não houver token
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
