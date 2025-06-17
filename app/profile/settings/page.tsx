// app/profile/settings/page.tsx
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ProfileSettingsForm from "../profile-settings-form";

export const metadata: Metadata = {
  title: "Profile Settings | Finnish Harbor Guesser",
  description: "Update your Finnish Harbor Guesser profile settings",
};

export default async function ProfileSettingsPage() {
  // Await cookies() before using it
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch (error) {
    console.error("Error fetching profile:", error);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <ProfileSettingsForm user={user} profile={profile} />
      </div>
    </div>
  );
}