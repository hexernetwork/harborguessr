import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import BilingualRegisterForm from "@/components/auth/bilingual-register-form"

export const metadata: Metadata = {
  title: "Register | Finnish Harbor Guesser",
  description: "Create a new account for Finnish Harbor Guesser",
}

export default async function RegisterPage() {
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
              <BilingualRegisterForm />
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
    // If Supabase client fails, still show the register form
    console.error("Error in register page:", error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-md">
              <BilingualRegisterForm />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
