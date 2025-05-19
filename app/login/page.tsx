import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import BilingualLoginForm from "@/components/auth/bilingual-login-form";
import { createClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Login | Finnish Harbor Guesser",
  description: "Sign in to your Finnish Harbor Guesser account",
};

export default async function LoginPage({ searchParams }: { searchParams: { registered?: string; reset?: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  if (session) redirect("/profile");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            <BilingualLoginForm initialSession={session} />
          </div>
        </div>
        <div className="mt-auto text-center py-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Finnish Harbor Guesser. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}