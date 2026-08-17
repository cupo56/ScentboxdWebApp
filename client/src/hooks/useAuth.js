import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, profile, session, loading, error, login, register, logout, clearError, setProfile } =
    useAuthStore();

  const isAuthenticated = !!session;
  const shelfPath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    shelfPath,
    login,
    register,
    logout,
    clearError,
    setProfile,
  };
}
