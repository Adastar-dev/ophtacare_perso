"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { api, setToken, clearToken, getToken, onUnauthorized } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Jeton expiré ou révoqué : on revient à l'écran de connexion
    onUnauthorized(() => setUserState(null))

    if (!getToken()) {
      setIsLoading(false)
      return
    }
    api
      .get<User>("/user")
      .then(setUserState)
      .catch(() => {
        clearToken()
        setUserState(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>("/login", { email, password }, false)
    setToken(res.access_token)
    setUserState(res.user)
    return res.user
  }

  const logout = () => {
    api.post("/logout").catch(() => {})
    clearToken()
    setUserState(null)
  }

  const setUser = useCallback((u: User) => setUserState(u), [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth doit être utilisé dans AuthProvider")
  return context
}
