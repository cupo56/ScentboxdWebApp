import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!user) {
    // Leitet auf /login um, speichert aber die ursprüngliche URL in 'state.from',
    // damit der User nach dem Login direkt dorthin zurückgeleitet werden kann.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
