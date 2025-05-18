"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getTranslation, type Language } from "@/lib/translations"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

// Create a default context value with a working t function
const defaultContextValue: LanguageContextType = {
  language: "fi",
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => {
    // Simple fallback implementation
    if (key === "home.title") return "Finnish Harbor Guesser"
    if (key.startsWith("navigation.")) {
      const navItem = key.split(".")[1]
      return navItem.charAt(0).toUpperCase() + navItem.slice(1)
    }
    return key
  },
}

const LanguageContext = createContext<LanguageContextType>(defaultContextValue)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to Finnish
  const [language, setLanguage] = useState<Language>("fi")

  // Load saved language preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language
      if (savedLanguage && ["en", "fi", "sv"].includes(savedLanguage)) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language)
    }
  }, [language])

  // Translation function
  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params)
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  return context
}
