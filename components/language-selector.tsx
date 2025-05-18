"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[1] // Default to Finnish

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} className="cursor-pointer" onClick={() => setLanguage(lang.code)}>
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
