// app/admin/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/admin-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Finnish Harbor Guesser",
  description: "Manage harbors, trivia questions, and users",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Server-side auth check
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Server-side admin check
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.user_metadata?.role === 'admin';
  
  if (!isAdmin) {
    redirect("/");
  }

  // Pass initial user data to client component
  return <AdminDashboard initialUser={user} />;
}