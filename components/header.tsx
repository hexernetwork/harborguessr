"use client";

import Link from "next/link";
import { Anchor, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import UserNav from "@/components/user-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useLanguage } from "@/contexts/language-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isClient, setIsClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();
  const { t, language, setLanguage } = useLanguage() || { t: (k) => k, language: "en", setLanguage: () => {} };

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
    
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkAuth();

    // Add auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const renderInlineLanguageSelector = () => {
    if (!mounted) return null;
    const languages = [{ code: "en", name: "English", flag: "🇬🇧" }, { code: "fi", name: "Suomi", flag: "🇫🇮" }, { code: "sv", name: "Svenska", flag: "🇸🇪" }];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="w-9 px-0"><span className="text-lg">{languages.find(l => l.code === language)?.flag}</span><span className="sr-only">{t("settings.language")}</span></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">{languages.map(lang => <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}><span className="mr-2">{lang.flag}</span>{lang.name}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2"><Anchor className="h-6 w-6 text-blue-600" /><span className="text-xl font-bold">{t("home.title")}</span></Link>
        <nav className="hidden md:flex items-center gap-4"><Link href="/location-game"><Button variant="ghost">{t("navigation.locationGame")}</Button></Link><Link href="/trivia-game"><Button variant="ghost">{t("navigation.triviaGame")}</Button></Link><Link href="/about"><Button variant="ghost">{t("navigation.about")}</Button></Link><Link href="/how-to-play"><Button variant="ghost">{t("navigation.howToPlay")}</Button></Link></nav>
        <div className="flex items-center gap-2">
          {renderInlineLanguageSelector()}
          <ThemeToggle />
          {isClient && isLoggedIn ? <UserNav /> : <Link href="/login"><Button variant="outline" size="sm" className="hidden sm:flex">{language === "fi" ? "Kirjaudu sisään" : "Sign In"}</Button></Link>}
          <Sheet><SheetTrigger asChild className="md:hidden"><Button variant="ghost" size="icon" aria-label={t("navigation.toggleMenu")}><Menu className="h-5 w-5" /><span className="sr-only">{t("navigation.toggleMenu")}</span></Button></SheetTrigger><SheetContent side="right"><nav className="flex flex-col gap-4 mt-8"><Link href="/location-game"><Button variant="ghost" className="w-full justify-start">{t("navigation.locationGame")}</Button></Link><Link href="/trivia-game"><Button variant="ghost" className="w-full justify-start">{t("navigation.triviaGame")}</Button></Link><Link href="/about"><Button variant="ghost" className="w-full justify-start">{t("navigation.about")}</Button></Link><Link href="/how-to-play"><Button variant="ghost" className="w-full justify-start">{t("navigation.howToPlay")}</Button></Link>{!isLoggedIn && <Link href="/login"><Button variant="outline" className="w-full justify-start">{language === "fi" ? "Kirjaudu sisään" : "Sign In"}</Button></Link>}</nav></SheetContent></Sheet>
        </div>
      </div>
    </header>
  );
}