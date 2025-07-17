// app/admin/page.tsx
'use client';

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const runtime = 'edge';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
        return;
      }
      
      const isAdmin = user?.user_metadata?.role === 'admin';
      if (!isAdmin) {
        router.replace("/");
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user?.user_metadata?.role !== 'admin') {
    return null;
  }

  return <AdminDashboard initialUser={user} />;
}