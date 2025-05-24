// bilingual-login-form.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ship, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function BilingualLoginForm({ initialSession }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage() || { t: (k) => k, language: "en" };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setSuccess(
        language === "fi" ? "Rekisteröityminen onnistui! Kirjaudu sisään." : "Registration successful! Please sign in."
      );
    }
    if (initialSession) router.push("/profile");
  }, [searchParams, language, initialSession, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/profile");
      // Remove router.refresh() as the auth state listener in UserNav will handle updates
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Ship className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl text-center">{language === "fi" ? "Kirjaudu sisään" : "Sign in"}</CardTitle>
        <CardDescription className="text-center">{t("auth.signInDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading
              ? language === "fi"
                ? "Kirjaudutaan..."
                : "Signing in..."
              : language === "fi"
              ? "Kirjaudu sisään"
              : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {language === "fi" ? "Rekisteröidy" : "Register"}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}