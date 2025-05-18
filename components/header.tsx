"use client"

import Link from "next/link"
import { Anchor, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import UserNav from "@/components/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Header() {
  const [isClient, setIsClient] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use a safer way to access the language context with fallback
  const languageContext = useLanguage()

  // Create a fallback t function in case the context is not available
  const t = (key: string, params?: Record<string, string | number>) => {
    if (languageContext && typeof languageContext.t === "function") {
      return languageContext.t(key, params)
    }

    // Fallback translations for critical UI elements
    if (key === "home.title") return "Finnish Harbor Guesser"
    if (key === "navigation.locationGame") return "Location Game"
    if (key === "navigation.triviaGame") return "Trivia Game"
    if (key === "navigation.about") return "About"
    if (key === "navigation.howToPlay") return "How to Play"
    if (key === "navigation.signIn") return "Sign In"
    if (key === "common.back") return "Back"
    if (key === "settings.language") return "Language"

    // Return the key as a last resort
    return key
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    setIsClient(true)

    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // Use the exported supabase instance directly instead of createClient
        const { data } = await supabase.auth.getSession()
        setIsLoggedIn(!!data.session)
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  // Inline language selector
  const renderInlineLanguageSelector = () => {
    if (!mounted) return null

    const languages = [
      { code: "en", name: "English", flag: "🇬🇧" },
      { code: "fi", name: "Suomi", flag: "🇫🇮" },
      { code: "sv", name: "Svenska", flag: "🇸🇪" },
    ]

    const language = languageContext?.language || "fi"
    const setLanguage = languageContext?.setLanguage || (() => {})

    const currentLanguage = languages.find((lang) => lang.code === language) || languages[1] // Default to Finnish

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-9 px-0">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="sr-only">{t("settings.language")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              className="cursor-pointer"
              onClick={() => {
                try {
                  setLanguage(lang.code as any)
                } catch (error) {
                  console.error("Error setting language:", error)
                }
              }}
            >
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Anchor className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">{t("home.title")}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/location-game">
            <Button variant="ghost">{t("navigation.locationGame")}</Button>
          </Link>
          <Link href="/trivia-game">
            <Button variant="ghost">{t("navigation.triviaGame")}</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">{t("navigation.about")}</Button>
          </Link>
          <Link href="/how-to-play">
            <Button variant="ghost">{t("navigation.howToPlay")}</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {renderInlineLanguageSelector()}
          <ThemeToggle />
          {isClient && isLoggedIn ? (
            <UserNav />
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                {t("navigation.signIn")}
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/location-game">
                  <Button variant="ghost" className="w-full justify-start">
                    {t("navigation.locationGame")}
                  </Button>
                </Link>
                <Link href="/trivia-game">
                  <Button variant="ghost" className="w-full justify-start">
                    {t("navigation.triviaGame")}
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" className="w-full justify-start">
                    {t("navigation.about")}
                  </Button>
                </Link>
                <Link href="/how-to-play">
                  <Button variant="ghost" className="w-full justify-start">
                    {t("navigation.howToPlay")}
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
