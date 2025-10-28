import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { UserProfile } from '../services/api'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  error: string | null
  loginUser: (credentials: { email: string; password: string }) => Promise<void>
  registerUser: (user: { email: string; password: string; full_name?: string }) => Promise<void>
  logoutUser: () => Promise<void>
  clearAuthError: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token')
      
      if (storedToken) {
        try {
          setToken(storedToken)
          const userProfile = await api.getCurrentUser()
          setUser(userProfile)
        } catch (err) {
          console.error('Failed to get user profile:', err)
          localStorage.removeItem('access_token')
          setToken(null)
          setUser(null)
        }
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const loginUser = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.login(credentials)
      
      setUser({
        id: response.user_id,
        email: response.email,
        full_name: response.full_name
      })
      setToken(response.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const registerUser = async (userData: { email: string; password: string; full_name?: string }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.register(userData)
      
      setUser({
        id: response.user_id,
        email: response.email,
        full_name: response.full_name
      })
      setToken(response.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logoutUser = async () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    await api.logout()
  }

  const clearAuthError = () => {
    setError(null)
  }

  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        loginUser,
        registerUser,
        logoutUser,
        clearAuthError,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

