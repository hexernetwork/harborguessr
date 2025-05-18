"use client"

import Link from "next/link"
import { Compass, Ship, Navigation, Anchor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useState, useEffect } from "react"

export default function HomeContent() {
  const [mounted, setMounted] = useState(false)
  const languageContext = useLanguage()

  // Create a fallback t function in case the context is not available
  const t = (key: string, params?: Record<string, string | number>) => {
    if (languageContext && typeof languageContext.t === "function") {
      return languageContext.t(key, params)
    }

    // Fallback translations for critical UI elements
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
    if (key === "navigation.about") return "About"
    if (key === "navigation.howToPlay") return "How to Play"

    // Return the key as a last resort
    return key
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Return nothing during SSR to prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Ship className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              <Anchor className="h-8 w-8 text-blue-500 dark:text-blue-300 absolute -bottom-2 -right-2" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">{t("home.title")}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{t("home.subtitle")}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
            <div className="h-48 bg-blue-500 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Navigation className="h-20 w-20 text-white opacity-50" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("home.locationGameTitle")}</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{t("home.locationGameDescription")}</p>
              <Link href="/location-game">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {t("home.playLocationGame")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
            <div className="h-48 bg-teal-500 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Compass className="h-20 w-20 text-white opacity-50" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("home.triviaGameTitle")}</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{t("home.triviaGameDescription")}</p>
              <Link href="/trivia-game">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">{t("home.playTriviaGame")}</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">{t("home.footer")}</p>
          <div className="flex justify-center gap-4">
            <Link href="/about">
              <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                {t("navigation.about")}
              </Button>
            </Link>
            <Link href="/how-to-play">
              <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                {t("navigation.howToPlay")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
