// "use client"

// import type React from "react"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { signIn } from "@/lib/auth"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import Link from "next/link"
// import { getTranslations } from "@/lib/db-utils"
// import { getUserLanguage } from "@/lib/data"

// export default function LoginForm() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const router = useRouter()
//   const translations = getTranslations(getUserLanguage())

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError(null)

//     const result = await signIn(email, password)

//     if (result.error) {
//       setError(result.error.message)
//       setLoading(false)
//     } else {
//       router.push("/")
//       router.refresh()
//     }
//   }

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//         <CardTitle>{translations.login || "Log In"}</CardTitle>
//         <CardDescription>
//           {translations.loginDescription || "Enter your email and password to access your account"}
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {error && (
//             <Alert variant="destructive">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           <div className="space-y-2">
//             <Label htmlFor="email">{translations.email || "Email"}</Label>
//             <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="password">{translations.password || "Password"}</Label>
//             <Input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           <Button type="submit" className="w-full" disabled={loading}>
//             {loading ? translations.loggingIn || "Logging in..." : translations.login || "Log In"}
//           </Button>
//         </form>
//       </CardContent>
//       <CardFooter className="flex justify-center">
//         <p className="text-sm text-center">
//           {translations.noAccount || "Don't have an account?"}{" "}
//           <Link href="/signup" className="text-blue-600 hover:underline">
//             {translations.signUp || "Sign Up"}
//           </Link>
//         </p>
//       </CardFooter>
//     </Card>
//   )
// }
