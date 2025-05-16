"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { updateUserPreferredLanguage } from "@/lib/supabase-data"

export default function LanguageSelector() {
  const router = useRouter()
  const [language, setLanguage] = useState("fi") // Set Finnish as default
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get language from localStorage or default to Finnish
    const storedLanguage = localStorage.getItem("preferredLanguage") || "fi"
    setLanguage(storedLanguage)

    // Get current user
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error getting user:", error)
      }
    }

    getUser()
  }, [])

  const changeLanguage = async (newLanguage) => {
    // Update state
    setLanguage(newLanguage)

    // Save to localStorage
    localStorage.setItem("preferredLanguage", newLanguage)

    // If user is logged in, save to their profile
    if (user) {
      await updateUserPreferredLanguage(user.id, newLanguage)
    }

    // Refresh the page to apply the language change
    router.refresh()
  }

  // Language options with emoji flags
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fi", name: "Suomi", flag: "🇫🇮" },
    { code: "sv", name: "Svenska", flag: "🇸🇪" },
  ]

  // Find current language details
  const currentLanguage = languages.find((lang) => lang.code === language) || languages[1] // Default to Finnish

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative flex items-center gap-1 px-2">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={language === lang.code ? "bg-slate-100 dark:bg-slate-800" : ""}
          >
            <span className="mr-2 text-lg">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
