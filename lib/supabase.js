import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Global variable to store the client instance
let supabaseInstance = null;

// Create or get Supabase client (singleton)
export const createClient = (options = {}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are missing.");
    return null;
  }

  try {
    if (supabaseInstance) return supabaseInstance;

    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        ...options.auth,
      },
    });
    console.log("Supabase client initialized successfully");
    return supabaseInstance;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
};

// Initialize Supabase client for export
export const supabase = createClient();

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }
    return session?.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Helper function to get the current session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};