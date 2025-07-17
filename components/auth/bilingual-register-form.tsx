"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Ship, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { registerUser } from "@/app/actions/auth"

export default function BilingualRegisterForm() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      console.log("Starting registration process")

      // Create a FormData object to pass to the server action
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("username", username)
      formData.append("language", language)

      // Call the server action
      const result = await registerUser(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      setSuccess(
        language === "fi"
          ? "Rekisteröityminen onnistui! Ohjataan kirjautumissivulle..."
          : "Registration successful! Redirecting to login page...",
      )

      // Redirect to login page with success message after a short delay
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 2000)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Ship className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl text-center">{language === "fi" ? "Rekisteröidy" : "Register"}</CardTitle>
        <CardDescription className="text-center">{t("auth.createAccountDescription")}</CardDescription>
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("auth.username")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
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
            <Label htmlFor="password">{t("auth.password")}</Label>
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
                minLength={6}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("auth.passwordRequirements")}</p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading
              ? language === "fi"
                ? "Luodaan tiliä..."
                : "Creating account..."
              : language === "fi"
                ? "Rekisteröidy"
                : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {language === "fi" ? "Kirjaudu sisään" : "Sign in"}
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
