/**
 * Authentication Hooks
 *
 * React hooks for managing authentication state and JWT tokens
 */

import { create } from 'zustand'

export interface AuthUser {
  userId: string
  email: string
  username: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  login: (user: AuthUser, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  
  login: (user, token) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('authUser', JSON.stringify(user))
    set({
      user,
      token,
      isAuthenticated: true,
      error: null,
    })
  },

  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  loadFromStorage: () => {
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('authUser')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({
          token,
          user,
          isAuthenticated: true,
        })
      } catch (error) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
      }
    }
  },
}))

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated
}

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  return { user, isLoading }
}

/**
 * Hook to manage authentication
 */
export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, error } = useAuthStore(
    (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
    }),
  )
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const setError = useAuthStore((state) => state.setError)
  const setLoading = useAuthStore((state) => state.setLoading)

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setError,
    setLoading,
  }
}
