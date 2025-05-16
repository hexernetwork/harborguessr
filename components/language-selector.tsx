"use client"

import { useState, useEffect } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserLanguage, setUserLanguage } from "@/lib/data"

export default function LanguageSelector() {
  const [language, setLanguage] = useState("en")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLanguage(getUserLanguage())
  }, [])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    setUserLanguage(lang)
    setIsOpen(false)

    // Reload the page to apply language changes
    window.location.reload()
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase text-xs">{language}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            <button
              className={`w-full text-left px-4 py-2 text-sm ${language === "en" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
              onClick={() => changeLanguage("en")}
            >
              English
            </button>
            <button
              className={`w-full text-left px-4 py-2 text-sm ${language === "fi" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
              onClick={() => changeLanguage("fi")}
            >
              Suomi
            </button>
            <button
              className={`w-full text-left px-4 py-2 text-sm ${language === "sv" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
              onClick={() => changeLanguage("sv")}
            >
              Svenska
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
