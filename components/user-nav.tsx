"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useLanguage } from "@/contexts/language-context";

export default function UserNav() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();
  const { t } = useLanguage() || { t: (k) => k };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) setUser(data.session.user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
    setIsLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 rounded-full"><Avatar className="h-8 w-8">{user?.user_metadata?.avatar_url ? <AvatarImage src={user.user_metadata.avatar_url} alt="User" /> : <AvatarImage src="/abstract-geometric-shapes.png" alt="User" />}<AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel><div className="flex flex-col space-y-1"><p className="text-sm font-medium">{user?.email || "User"}</p><p className="text-xs text-muted-foreground">{user?.email}</p></div></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup><DropdownMenuItem onClick={() => router.push("/profile")}>{t("navigation.profile")}</DropdownMenuItem><DropdownMenuItem onClick={() => router.push("/profile/settings")}>{t("navigation.settings")}</DropdownMenuItem></DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>{isLoading ? "Signing out..." : t("navigation.signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}