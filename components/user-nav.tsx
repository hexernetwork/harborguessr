// components/user-nav.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/language-context";

export default function UserNav() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage() || { t: (k) => k };

  useEffect(() => {
    setMounted(true);
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("UserNav: Error getting initial session:", error);
        }
        setUser(session?.user || null);
        console.log("UserNav: Initial session user:", session?.user?.id || 'No user');
      } catch (error) {
        console.error("UserNav: Error in getInitialSession:", error);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('UserNav auth state changed:', event, session?.user?.id || 'No user');
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      console.log("UserNav: Attempting to sign out...");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("UserNav: Sign out error:", error);
      } else {
        console.log("UserNav: Sign out successful");
      }
      
      // Clear user state immediately
      setUser(null);
      
      // Redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("UserNav: Unexpected error during sign out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // If no user, show login button
  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs sm:text-sm px-2 sm:px-3"
        onClick={() => router.push("/login")}
      >
        {t("navigation.signIn")}
      </Button>
    );
  }

  // If user is logged in, show avatar dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {user?.user_metadata?.avatar_url && (
              <AvatarImage src={user.user_metadata.avatar_url} alt="User" />
            )}
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
              {user?.user_metadata?.username?.charAt(0)?.toUpperCase() || 
               user?.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user?.user_metadata?.username || user?.user_metadata?.display_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            {t("navigation.profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/leaderboard")}>
            <Trophy className="h-4 w-4 mr-2" />
            {t("navigation.leaderboard")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile/settings")}>
            {t("navigation.settings")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          {isLoading ? t("common.signingOut") : t("navigation.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}