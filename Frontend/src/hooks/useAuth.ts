// Dummy fallback auth hook to avoid missing store during build
export const useAuth = () => {
  return {
    user: null as any,
    token: null as any,
    loading: false,
    error: null as any,
    loginUser: async (_credentials: { email: string; password: string }) => undefined,
    logoutUser: async () => undefined,
    clearAuthError: () => undefined,
    isAuthenticated: false,
  }
}