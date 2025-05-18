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
    if (key === "home.subtitle") return "Navigate the nautical charts to find harbors across Finland"
    if (key === "home.locationGameTitle") return "Harbor Location Guesser"
    if (key === "home.locationGameDescription")
      return "Find Finnish harbors on nautical charts using progressive hints. Each wrong guess reveals a new hint!"
    if (key === "home.triviaGameTitle") return "Harbor Trivia"
    if (key === "home.triviaGameDescription")
      return "Test your knowledge about Finnish harbors with our trivia challenge."
    if (key === "home.playLocationGame") return "Play Location Game"
    if (key === "home.playTriviaGame") return "Play Trivia Game"
    if (key === "home.footer") return "Learn about Finland's maritime heritage while having fun!"
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
    try {
      return getTranslation(language, key, params)
    } catch (error) {
      console.error(`Error translating key: ${key}`, error)
      // Fallback to default context's t function
      return defaultContextValue.t(key, params)
    }
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    console.warn("useLanguage hook used outside of LanguageProvider")
    return defaultContextValue
  }
  return context
}
