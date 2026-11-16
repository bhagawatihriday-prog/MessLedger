import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import { PageLoader } from './Loader';

export const RoleProtectedRoute = ({ allowedRole, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader text="Verifying permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthority = user?.role === 'ADMIN' || user?.role === 'SENIOR_WARDEN' || user?.role === 'WARDEN';
  const isStudent = user?.role === 'STUDENT';

  if (allowedRole === 'ADMIN' && !isAuthority) {
    return <Navigate to="/login/dashboard" replace />;
  }

  if (allowedRole === 'STUDENT' && !isStudent) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};
