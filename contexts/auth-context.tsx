// auth-context.tsx
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const defaultContextValue = {
  user: null,
  loading: true,
}

const AuthContext = createContext(defaultContextValue)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log("Initial user check:", user?.id || "No user")
        setUser(user || null)
      } catch (error) {
        console.error("Error getting initial user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id || "No user")
      
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = { 
    user, 
    loading,
    refreshUser: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log("Refreshed user:", user?.id || "No user")
        setUser(user || null)
        return user || null
      } catch (error) {
        console.error("Error refreshing user:", error)
        return null
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context || defaultContextValue
}
