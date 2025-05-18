"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

// Create a default context value to prevent null errors
const defaultContextValue = {
  user: null,
  loading: true,
}

const AuthContext = createContext(defaultContextValue)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error getting user session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Set up auth state listener
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("Error setting up auth state listener:", error)
      return () => {}
    }
  }, [])

  const value = { user, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  // Return the default context value if the context is null
  return context || defaultContextValue
}
