"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string
  const language = formData.get("language") as string

  console.log("Registering user:", { email, username, language })

  // Regular client for auth operations
  const supabase = createServerComponentClient({ cookies })

  try {
    // Register the user with auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          preferred_language: language,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
      },
    })

    if (authError) {
      console.error("Auth error during registration:", authError)
      return { success: false, error: authError.message }
    }

    console.log("User registered successfully:", authData)

    // Let's check if the profile was created by the trigger
    if (authData.user) {
      // Wait a moment for the trigger to execute
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (profileError) {
        console.error("Error checking profile:", profileError)
      } else {
        console.log("Profile data:", profileData)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Server action error:", error)
    return { success: false, error: error.message || "Failed to register" }
  }
}
