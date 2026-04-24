import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, profile, session, loading, error, login, register, logout, clearError, setProfile } =
    useAuthStore();

  const isAuthenticated = !!session;

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
    setProfile,
  };
}
