import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token) {
    // Redirect to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
