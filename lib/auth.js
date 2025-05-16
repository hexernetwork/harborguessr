import { createClient } from "@supabase/supabase-js"
import { getUserLanguage } from "./data"

// Initialize Supabase client lazily when needed
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not available")
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Sign up a new user
export async function signUp(email, password, username) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // Create a profile for the user
    if (authData?.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        username,
        preferred_language: getUserLanguage(),
      })

      if (profileError) throw profileError
    }

    return { success: true, user: authData?.user }
  } catch (error) {
    console.error("Error signing up:", error)
    return { error }
  }
}

// Sign in an existing user
export async function signIn(email, password) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { success: true, user: data?.user, session: data?.session }
  } catch (error) {
    console.error("Error signing in:", error)
    return { error }
  }
}

// Sign out the current user
export async function signOut() {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { error }
  }
}

// Get the current user
export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  if (!supabase) return { user: null }

  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error

    return { user: data?.user }
  } catch (error) {
    console.error("Error getting current user:", error)
    return { user: null }
  }
}

// Get the user's profile
export async function getUserProfile(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return { profile: null }

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) throw error

    return { profile: data }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return { profile: null }
  }
}

// Update the user's profile
export async function updateUserProfile(userId, updates) {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: { message: "Supabase client not initialized" } }

  try {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

    if (error) throw error

    return { success: true, profile: data }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { error }
  }
}
