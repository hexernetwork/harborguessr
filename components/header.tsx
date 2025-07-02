// components/header.tsx

"use client";

import Link from "next/link";
import { Anchor, Menu, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import UserNav from "@/components/user-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Use singleton instance
import { useLanguage } from "@/contexts/language-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isClient, setIsClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t, language, setLanguage } = useLanguage() || { t: (k) => k, language: "en", setLanguage: () => {} };

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session in header:", error);
        }
        setIsLoggedIn(!!session);
        console.log('Header initial auth check:', session?.user?.id || 'No user');
      } catch (error) {
        console.error("Error in checkAuth header:", error);
      }
    };
    
    checkAuth();

    // Add auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Header auth state changed:', event, session?.user?.id || 'No user');
      setIsLoggedIn(!!session);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const renderInlineLanguageSelector = () => {
    if (!mounted) return null;
    const languages = [
      { code: "en", name: "English", flag: "🇬🇧" }, 
      { code: "fi", name: "Suomi", flag: "🇫🇮" }, 
      { code: "sv", name: "Svenska", flag: "🇸🇪" }
    ];
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 p-0 flex-shrink-0">
            <span className="text-base">{languages.find(l => l.code === language)?.flag}</span>
            <span className="sr-only">{t("settings.language")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map(lang => (
            <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-2 sm:px-4">
        {/* Logo and Title - Responsive */}
        <Link href="/" className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
          <Anchor className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
          <span className="text-base sm:text-lg lg:text-xl font-bold truncate">
            {/* Show short title on very small screens, full title on larger screens */}
            <span className="hidden sm:inline">{t("home.title")}</span>
            <span className="sm:hidden">{t("home.titleShort")}</span>
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-4">
          <Link href="/location-game">
            <Button variant="ghost" size="sm">{t("navigation.locationGame")}</Button>
          </Link>
          <Link href="/trivia-game">
            <Button variant="ghost" size="sm">{t("navigation.triviaGame")}</Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {t("navigation.leaderboard")}
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="sm">{t("navigation.about")}</Button>
          </Link>
          <Link href="/how-to-play">
            <Button variant="ghost" size="sm">{t("navigation.howToPlay")}</Button>
          </Link>
        </nav>
        
        {/* Right Side Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {renderInlineLanguageSelector()}
          <ThemeToggle />
          {isClient && isLoggedIn ? (
            <UserNav />
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden xs:flex text-xs sm:text-sm px-2 sm:px-3">
                {language === "fi" ? "Kirjaudu" : "Sign In"}
              </Button>
            </Link>
          )}
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label={t("navigation.toggleMenu")} className="h-8 w-8 sm:h-9 sm:w-9">
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">{t("navigation.toggleMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 sm:w-72">
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
                <Link href="/leaderboard">
                  <Button variant="ghost" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    {t("navigation.leaderboard")}
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
                {!isLoggedIn && (
                  <Link href="/login">
                    <Button variant="outline" className="w-full justify-start">
                      {language === "fi" ? "Kirjaudu sisään" : "Sign In"}
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}