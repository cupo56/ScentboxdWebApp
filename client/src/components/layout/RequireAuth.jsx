import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SignInPrompt from './SignInPrompt';

/**
 * Route guard. Ohne Login: Redirect nach /login, oder — wenn `prompt`
 * gesetzt ist — eine Sign-in-Karte an Ort und Stelle (für Tabs wie
 * Favorites und Collection, die auch ohne Login einen Sinn ergeben sollen).
 */
export default function RequireAuth({ children, prompt }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return prompt ? <SignInPrompt {...prompt} /> : <Navigate to="/login" replace />;
  }

  return children;
}
