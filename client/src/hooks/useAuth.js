import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, token, loading, error, login, register, logout, clearError } =
    useAuthStore();

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    clearError,
  };
}
