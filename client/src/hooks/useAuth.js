import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, profile, session, loading, error, login, register, logout, clearError, setProfile } =
    useAuthStore();

  const isAuthenticated = !!session;
  // Eigene Profilseite (Listen, Reviews). Nicht eingeloggt → Login.
  const profilePath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';
  const collectionPath = '/collection';
  const favoritesPath = '/favorites';

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    profilePath,
    collectionPath,
    favoritesPath,
    login,
    register,
    logout,
    clearError,
    setProfile,
  };
}
