"use client"

import Link from "next/link"
import { Anchor, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSelector from "@/components/language-selector"
import UserNav from "@/components/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

export default function Header() {
  const [isClient, setIsClient] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { createClient } = await import("@/lib/supabase")
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        setIsLoggedIn(!!data.session)
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Anchor className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Harbor Guesser</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/location-game">
            <Button variant="ghost">Location Game</Button>
          </Link>
          <Link href="/trivia-game">
            <Button variant="ghost">Trivia Game</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">About</Button>
          </Link>
          <Link href="/how-to-play">
            <Button variant="ghost">How to Play</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          {isClient && isLoggedIn ? (
            <UserNav />
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Sign In
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
                    Location Game
                  </Button>
                </Link>
                <Link href="/trivia-game">
                  <Button variant="ghost" className="w-full justify-start">
                    Trivia Game
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" className="w-full justify-start">
                    About
                  </Button>
                </Link>
                <Link href="/how-to-play">
                  <Button variant="ghost" className="w-full justify-start">
                    How to Play
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
