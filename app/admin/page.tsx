// app/admin/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AdminDashboard from "@/components/admin/admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Finnish Harbor Guesser",
  description: "Manage harbors, trivia questions, and users",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Get user data (auth already verified by middleware)
  const { data: { user } } = await supabase.auth.getUser();
  
  return <AdminDashboard initialUser={user} />;
}