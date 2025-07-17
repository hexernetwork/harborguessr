// app/login/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BilingualLoginForm from "@/components/auth/bilingual-login-form"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
      
      if (session) {
        router.push("/profile")
      }
    }

    getSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            <BilingualLoginForm initialSession={session} />
          </div>
        </div>
        <div className="mt-auto text-center py-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Finnish Harbor Guesser. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}