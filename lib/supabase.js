import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client if environment variables are missing
let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Using a mock client.")

  // Create a mock client that won't throw errors but won't work either
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signUp: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
          limit: async () => ({ data: [], error: null }),
        }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
        count: () => ({
          eq: async () => ({ data: 0, error: null }),
        }),
        limit: async () => ({ data: [], error: null }),
      }),
      insert: () => ({ error: { message: "Supabase not configured" } }),
      upsert: () => ({ error: { message: "Supabase not configured" } }),
      update: () => ({ error: { message: "Supabase not configured" } }),
    }),
    rpc: () => ({ error: { message: "Supabase not configured" } }),
  }
} else {
  try {
    // Create the real client if environment variables are available
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    console.log("Supabase client initialized successfully")
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    // Fallback to mock client
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: "Supabase initialization failed" } }),
        signUp: async () => ({ data: null, error: { message: "Supabase initialization failed" } }),
        resetPasswordForEmail: async () => ({ error: null }),
        updateUser: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
            limit: async () => ({ data: [], error: null }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
          count: () => ({
            eq: async () => ({ data: 0, error: null }),
          }),
          limit: async () => ({ data: [], error: null }),
        }),
        insert: () => ({ error: { message: "Supabase initialization failed" } }),
        upsert: () => ({ error: { message: "Supabase initialization failed" } }),
        update: () => ({ error: { message: "Supabase initialization failed" } }),
      }),
      rpc: () => ({ error: { message: "Supabase initialization failed" } }),
    }
  }
}

export { supabase }

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return session?.user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Helper function to get the current session
export const getSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey
}
