import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import BilingualForgotPasswordForm from "@/components/auth/bilingual-forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password | Finnish Harbor Guesser",
  description: "Reset your Finnish Harbor Guesser account password",
}

export default async function ForgotPasswordPage() {
  try {
    // Check if user is already logged in
    const supabase = createServerComponentClient({ cookies })
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      redirect("/profile")
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-md">
              <BilingualForgotPasswordForm />
            </div>
          </div>

          <div className="mt-auto text-center py-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Finnish Harbor Guesser. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    // If Supabase client fails, still show the form
    console.error("Error in forgot password page:", error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-md">
              <BilingualForgotPasswordForm />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
