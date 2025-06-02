// hooks/use-admin.ts
import { useAuth } from "@/contexts/auth-context";

export function useAdmin() {
  const { user } = useAuth();
  
  const isAdmin = user?.user_metadata?.role === 'admin';
  
  return {
    isAdmin,
    user,
    loading: !user // if user is null, we're still loading
  };
}