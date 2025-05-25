// lib/supabase.js
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Don't use singleton for auth helpers - they handle their own caching
export const supabase = createClientComponentClient();

console.log("Supabase client initialized successfully");

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!supabaseUrl && !!supabaseAnonKey;
};