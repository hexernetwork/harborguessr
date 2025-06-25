// hooks/use-admin.ts
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export function useAdmin() {
  const { user } = useAuth();
  
  // Check if user has admin role in any metadata location
  const isAdmin = user ? checkUserAdminRole(user) : false;
  
  // Get admin session data for API calls
  const getAdminSession = async () => {
    if (!isAdmin || !user) {
      throw new Error('User is not an authenticated admin');
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('Failed to get session');
    }

    return {
      token: session.access_token,
      userId: session.user.id,
      user: session.user,
    };
  };

  return {
    isAdmin,
    user,
    loading: !user, // if user is null, we're still loading
    canAccessAdmin: !!user && isAdmin,
    userEmail: user?.email || null,
    userId: user?.id || null,
    getAdminSession,
  };
}

// Check if user has admin role in metadata - COMPREHENSIVE VERSION
function checkUserAdminRole(user: any): boolean {
  // Method 1: Check raw_user_meta_data (primary method - what Supabase SQL sets)
  if (user.raw_user_meta_data?.role === 'admin') {
    console.log('✅ Admin role found in raw_user_meta_data');
    return true;
  }

  // Method 2: Check user_metadata (what Supabase client often uses)
  if (user.user_metadata?.role === 'admin') {
    console.log('✅ Admin role found in user_metadata');
    return true;
  }

  // Method 3: Check raw_app_meta_data (alternative method)
  if (user.raw_app_meta_data?.role === 'admin') {
    console.log('✅ Admin role found in raw_app_meta_data');
    return true;
  }

  // Method 4: Check app_metadata (legacy support)
  if (user.app_metadata?.role === 'admin') {
    console.log('✅ Admin role found in app_metadata');
    return true;
  }

  // Debug: Log all metadata locations for troubleshooting
  console.log('❌ No admin role found in any metadata location:', {
    raw_user_meta_data: user.raw_user_meta_data,
    user_metadata: user.user_metadata,
    raw_app_meta_data: user.raw_app_meta_data,
    app_metadata: user.app_metadata
  });

  return false;
}