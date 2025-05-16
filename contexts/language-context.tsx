"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getUserPreferredLanguage } from "@/lib/supabase-data"

const LanguageContext = createContext({
  language: "fi", // Set Finnish as default
  setLanguage: (lang: string) => {},
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fi") // Set Finnish as default
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // First check localStorage
        const storedLanguage = localStorage.getItem("preferredLanguage")

        if (storedLanguage) {
          setLanguage(storedLanguage)
          setLoading(false)
          return
        }

        // If not in localStorage, check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Get user's preferred language from profile
          const userLanguage = await getUserPreferredLanguage(session.user.id)
          setLanguage(userLanguage)

          // Save to localStorage for future visits
          localStorage.setItem("preferredLanguage", userLanguage)
        } else {
          // If no stored language and no user, default to Finnish
          localStorage.setItem("preferredLanguage", "fi")
        }
      } catch (error) {
        console.error("Error initializing language:", error)
        // Default to Finnish in case of error
        localStorage.setItem("preferredLanguage", "fi")
      } finally {
        setLoading(false)
      }
    }

    initLanguage()
  }, [])

  const handleSetLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem("preferredLanguage", lang)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>{children}</LanguageContext.Provider>
  )
}
